import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../data/services/api_client.dart';
import '../../../../data/services/offline_queue_service.dart';
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
  ApiClient? _api;
  SharedPreferences? _prefs;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;
  WebSocket? _ws;
  Timer? _wsRetryTimer;

  ApiClient get api => _api ??= ApiClient(tokenProvider: this);

  Future<void> bootstrap() async {
    loading = true;
    notifyListeners();

    await OfflineQueueService.instance.init();
    _prefs = await SharedPreferences.getInstance();
    token = _prefs?.getString('janrakshak_token');

    _connectivitySub = Connectivity().onConnectivityChanged.listen((result) {
      online = result.any((r) => r != ConnectivityResult.none);
      if (online) {
        syncQueuedMutations();
        _connectWebSocket();
      }
      notifyListeners();
    });

    if (token != null) {
      try {
        final me = await api.request('GET', '/auth/me');
        user = User.fromJson(asMap(me));
      } catch (_) {
        token = null;
        user = null;
      }
    }

    loading = false;
    notifyListeners();
    _connectWebSocket();
    if (online) {
      unawaited(syncQueuedMutations());
    }
  }

  Future<void> login(String email, String password) async {
    final res = asMap(
      await api.request('POST', '/auth/login', body: {
        'email': email,
        'password': password,
      }),
    );
    token = readString(res, 'token');
    user = User.fromJson(asMap(res['user']));
    if (token != null) {
      await _prefs?.setString('janrakshak_token', token!);
    }
    notifyListeners();
    _connectWebSocket();
  }

  Future<void> register(Map<String, dynamic> payload) async {
    final res = asMap(await api.request('POST', '/auth/register', body: payload));
    token = readString(res, 'token');
    user = User.fromJson(asMap(res['user']));
    if (token != null) {
      await _prefs?.setString('janrakshak_token', token!);
    }
    notifyListeners();
    _connectWebSocket();
  }

  Future<void> onboard(Map<String, dynamic> payload) async {
    await api.request('POST', '/auth/onboard', body: payload);
    await refreshMe();
  }

  Future<void> refreshMe() async {
    final me = await api.request('GET', '/auth/me');
    user = User.fromJson(asMap(me));
    notifyListeners();
  }

  Future<void> toggleRole() async {
    final res = asMap(await api.request('POST', '/auth/toggle-role'));
    final nextToken = readString(res, 'token');
    if (nextToken != null) {
      token = nextToken;
      await _prefs?.setString('janrakshak_token', nextToken);
    }
    await refreshMe();
  }

  @override
  Future<void> logout() async {
    token = null;
    user = null;
    liveAssignmentMessage = null;
    await _prefs?.remove('janrakshak_token');
    await _ws?.close();
    _ws = null;
    notifyListeners();
  }

  Future<void> syncQueuedMutations() async {
    final queued = await OfflineQueueService.instance.pending();
    for (final item in queued) {
      try {
        final body = item['body'] == null
            ? null
            : asMap(jsonDecode(item['body'] as String));
        await api.request(
          item['method'] as String,
          item['path'] as String,
          body: body,
          queueIfOffline: false,
        );
        await OfflineQueueService.instance.remove(item['id'] as int);
      } catch (_) {
        break;
      }
    }
  }

  void _connectWebSocket() {
    _wsRetryTimer?.cancel();
    if (user == null || !online) return;
    if (_ws != null) return;

    final base = AppConfig.backendApi.replaceAll('/api', '');
    final wsUrl = base.startsWith('https://')
        ? base.replaceFirst('https://', 'wss://')
        : base.replaceFirst('http://', 'ws://');

    unawaited(() async {
      try {
        final socket = await WebSocket.connect('$wsUrl/api/ws/live');
        _ws = socket;
        socket.listen((event) {
          try {
            final data = jsonDecode('$event');
            if (data is Map<String, dynamic> &&
                data['source'] == 'matching' &&
                data['target_volunteer_id'] == user?.id) {
              liveAssignmentMessage =
                  'New assignment received. Check your dashboard.';
              notifyListeners();
            }
          } catch (_) {}
        }, onDone: _scheduleWsReconnect, onError: (_) => _scheduleWsReconnect());
      } catch (_) {
        _scheduleWsReconnect();
      }
    }());
  }

  void _scheduleWsReconnect() {
    _ws = null;
    if (user == null) return;
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
    _ws?.close();
    super.dispose();
  }
}




