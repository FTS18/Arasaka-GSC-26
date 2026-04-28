import 'dart:async';
import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../../../../data/services/api_client.dart';
import '../../../../data/services/offline_queue_service.dart';
import '../../../../data/services/logger_service.dart';
import '../../../../domain/models/models.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';

class AuthProvider extends ChangeNotifier implements AuthTokenProvider {
  @override
  String? token;
  User? user;
  bool loading = true;
  bool online = true;
  String? liveAssignmentMessage;
  bool lowDataMode = false;
  ApiClient? _api;
  SharedPreferences? _prefs;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  WebSocketChannel? _wsChannel;
  StreamSubscription? _wsSub;
  Timer? _wsRetryTimer;
  late final LoggerService _logger = LoggerService.instance;

  ApiClient get api => _api ??= ApiClient(tokenProvider: this);

  Future<void> bootstrap() async {
    _logger.info('🚀 AuthProvider bootstrap started');
    loading = true;
    notifyListeners();

    try {
      await OfflineQueueService.instance.init();
      _prefs = await SharedPreferences.getInstance();
      token = _prefs?.getString('janrakshak_token');
      lowDataMode = _prefs?.getBool('janrakshak_low_data') ?? false;
      _logger.info(
        '📱 Loaded token from storage: ${token != null ? 'present' : 'missing'}',
      );

      _connectivitySub = Connectivity().onConnectivityChanged.listen((result) {
        final wasOnline = online;
        online = result.any((r) => r != ConnectivityResult.none);
        if (online != wasOnline) {
          _logger.info('🌐 Network status changed: online=$online');
          if (online) {
            _logger.info(
              '📡 Online - syncing queued mutations and connecting WebSocket',
            );
            syncQueuedMutations();
            _connectWebSocket();
          }
        }
        notifyListeners();
      });

      if (token != null) {
        try {
          _logger.logAuthEvent(
            'Token validation',
            details: {'status': 'validating'},
          );
          final me = await api.request('GET', '/auth/me');
          user = User.fromJson(asMap(me));
          _logger.logAuthEvent(
            'Token validation',
            details: {
              'status': 'success',
              'user_id': user?.id,
              'onboarded': user?.onboarded,
            },
          );
        } catch (e, st) {
          _logger.logAuthError('Token validation failed', e, st);
          token = null;
          user = null;
        }
      } else {
        _logger.info('⚠️ No token found - user needs to login');
      }
    } catch (e, st) {
      _logger.error('Bootstrap error', error: e, stackTrace: st);
    }

    loading = false;
    notifyListeners();
    _connectWebSocket();
    if (online) {
      unawaited(syncQueuedMutations());
    }
    _logger.info('✅ AuthProvider bootstrap completed');
  }

  Future<void> login(String email, String password) async {
    _logger.logAuthEvent('Login attempt', details: {'email': email});
    try {
      final res = asMap(
        await api.request(
          'POST',
          '/auth/login',
          body: {'email': email, 'password': password},
        ),
      );
      token = readString(res, 'token');
      user = User.fromJson(asMap(res['user']));
      if (token != null) {
        await _prefs?.setString('janrakshak_token', token!);
      }
      _logger.logAuthEvent(
        'Login success',
        details: {
          'user_id': user?.id,
          'email': user?.email,
          'onboarded': user?.onboarded,
        },
      );
      notifyListeners();
      _connectWebSocket();
    } catch (e, st) {
      _logger.logAuthError('Login failed', e, st);
      rethrow;
    }
  }

  Future<void> register(Map<String, dynamic> payload) async {
    _logger.logAuthEvent(
      'Register attempt',
      details: {'email': payload['email']},
    );
    try {
      final res = asMap(
        await api.request('POST', '/auth/register', body: payload),
      );
      token = readString(res, 'token');
      user = User.fromJson(asMap(res['user']));
      if (token != null) {
        await _prefs?.setString('janrakshak_token', token!);
      }
      _logger.logAuthEvent(
        'Register success',
        details: {'user_id': user?.id, 'email': user?.email},
      );
      notifyListeners();
      _connectWebSocket();
    } catch (e, st) {
      _logger.logAuthError('Register failed', e, st);
      rethrow;
    }
  }

  Future<void> onboard(Map<String, dynamic> payload) async {
    _logger.logAuthEvent('Onboarding started');
    try {
      await api.request('POST', '/auth/onboard', body: payload);
      await refreshMe();
      _logger.logAuthEvent(
        'Onboarding completed',
        details: {'user_id': user?.id, 'onboarded': user?.onboarded},
      );
    } catch (e, st) {
      _logger.logAuthError('Onboarding failed', e, st);
      rethrow;
    }
  }

  Future<void> refreshMe() async {
    _logger.debug('Refreshing user profile');
    try {
      final me = await api.request('GET', '/auth/me');
      user = User.fromJson(asMap(me));
      _logger.debug('User profile refreshed', error: {'user_id': user?.id});
      notifyListeners();
    } catch (e, st) {
      _logger.logAuthError('Profile refresh failed', e, st);
      rethrow;
    }
  }

  Future<void> toggleRole() async {
    _logger.logAuthEvent('Toggle role requested');
    try {
      final res = asMap(await api.request('POST', '/auth/toggle-role'));
      final nextToken = readString(res, 'token');
      if (nextToken != null) {
        token = nextToken;
        await _prefs?.setString('janrakshak_token', nextToken);
      }
      await refreshMe();
      _logger.logAuthEvent('Role toggled successfully');
    } catch (e, st) {
      _logger.logAuthError('Toggle role failed', e, st);
      rethrow;
    }
  }

  @override
  Future<void> logout() async {
    _logger.logAuthEvent('Logout requested');
    token = null;
    user = null;
    liveAssignmentMessage = null;
    await _prefs?.remove('janrakshak_token');
    await _wsSub?.cancel();
    _wsChannel?.sink.close();
    _wsChannel = null;
    _logger.logAuthEvent('Logout completed');
    notifyListeners();
  }
  
  void toggleLowDataMode(bool value) {
    lowDataMode = value;
    _prefs?.setBool('janrakshak_low_data', value);
    _logger.info('📱 Low-Data Mode: ${value ? 'ENABLED' : 'DISABLED'}');
    notifyListeners();
  }

  Future<void> syncQueuedMutations() async {
    _logger.info('📋 Syncing queued mutations...');
    try {
      final queued = await OfflineQueueService.instance.pending();
      _logger.info('Found ${queued.length} queued items');

      for (final item in queued) {
        try {
          final body = item['body'] == null
              ? null
              : asMap(jsonDecode(item['body'] as String));
          _logger.info('📤 Syncing: ${item['method']} ${item['path']}');

          await api.request(
            item['method'] as String,
            item['path'] as String,
            body: body,
            queueIfOffline: false,
          );

          await OfflineQueueService.instance.remove(item['id'] as int);
          _logger.info('✅ Synced: ${item['method']} ${item['path']}');
        } catch (e, st) {
          _logger.warning(
            '⚠️ Sync failed for ${item['path']}, will retry later',
            error: e,
            stackTrace: st,
          );
          break;
        }
      }
      _logger.info('✅ Queue sync completed');
    } catch (e, st) {
      _logger.error('Queue sync error', error: e, stackTrace: st);
    }
  }

  void _connectWebSocket() {
    _wsRetryTimer?.cancel();
    if (user == null || !online) {
      _logger.debug(
        'WebSocket connection skipped: user=${user != null}, online=$online',
      );
      return;
    }
    if (_wsChannel != null) {
      _logger.debug('WebSocket already connected');
      return;
    }

    final base = AppConfig.backendApi.replaceAll('/api', '');
    final wsUrl = base.startsWith('https://')
        ? base.replaceFirst('https://', 'wss://')
        : base.replaceFirst('http://', 'ws://');

    _logger.info('🔗 Attempting WebSocket connection to $wsUrl/api/ws/live');

    try {
      final channel = WebSocketChannel.connect(Uri.parse('$wsUrl/api/ws/live'));
      _wsChannel = channel;

      _wsSub = channel.stream.listen(
        (event) {
          try {
            final data = jsonDecode('$event');
            if (data is Map<String, dynamic> &&
                data['source'] == 'matching' &&
                data['target_volunteer_id'] == user?.id) {
              _logger.info('📩 Live assignment received: ${data['source']}');
              liveAssignmentMessage =
                  'New assignment received. Check your dashboard.';
              notifyListeners();
            }
          } catch (_) {}
        },
        onDone: () {
          _logger.info('🔌 WebSocket closed');
          _scheduleWsReconnect();
        },
        onError: (e) {
          _logger.warning('WebSocket error', error: e);
          _scheduleWsReconnect();
        },
      );
      _logger.info('✅ WebSocket connected');
    } catch (e, st) {
      _logger.warning('WebSocket connection failed', error: e, stackTrace: st);
      _scheduleWsReconnect();
    }
  }

  void _scheduleWsReconnect() {
    _wsChannel = null;
    _wsSub?.cancel();
    if (user == null) return;
    _logger.info('⏰ Scheduling WebSocket reconnect in 8 seconds');
    _wsRetryTimer = Timer(const Duration(seconds: 8), _connectWebSocket);
  }

  void clearLiveAssignmentNotice() {
    liveAssignmentMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    _wsRetryTimer?.cancel();
    _wsSub?.cancel();
    _wsChannel?.sink.close();
    super.dispose();
  }
}
