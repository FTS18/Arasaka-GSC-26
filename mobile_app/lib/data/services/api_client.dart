import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../services/offline_queue_service.dart';
import '../services/logger_service.dart';
import '../../ui/core/theme.dart';

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

abstract class AuthTokenProvider {
  String? get token;
  Future<void> logout();
}

class ApiClient {
  ApiClient({required this.tokenProvider});

  final AuthTokenProvider tokenProvider;

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final base = AppConfig.backendApi.endsWith('/')
        ? AppConfig.backendApi.substring(0, AppConfig.backendApi.length - 1)
        : AppConfig.backendApi;
    final p = path.startsWith('/') ? path : '/$path';
    final raw = Uri.parse('$base$p');
    if (query == null || query.isEmpty) return raw;
    return raw.replace(
      queryParameters: {
        for (final entry in query.entries)
          if (entry.value != null) entry.key: '${entry.value}'
      },
    );
  }

  Future<dynamic> request(
    String method,
    String path, {
    Map<String, dynamic>? query,
    Map<String, dynamic>? body,
    bool queueIfOffline = true,
  }) async {
    final uri = _uri(path, query);
    final headers = <String, String>{
      'Content-Type': 'application/json',
      if (tokenProvider.token != null) 'Authorization': 'Bearer ${tokenProvider.token}',
    };
    final logger = LoggerService.instance;

    // Log the request
    logger.logNetworkRequest(method, path, body: body);

    try {
      final stopwatch = Stopwatch()..start();
      http.Response response;
      
      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(uri, headers: headers).timeout(const Duration(seconds: 20));
          break;
        case 'POST':
          response = await http
              .post(uri, headers: headers, body: jsonEncode(body ?? {}))
              .timeout(const Duration(seconds: 20));
          break;
        case 'PUT':
          response = await http
              .put(uri, headers: headers, body: jsonEncode(body ?? {}))
              .timeout(const Duration(seconds: 20));
          break;
        case 'PATCH':
          response = await http
              .patch(uri, headers: headers, body: jsonEncode(body ?? {}))
              .timeout(const Duration(seconds: 20));
          break;
        case 'DELETE':
          response = await http.delete(uri, headers: headers).timeout(const Duration(seconds: 20));
          break;
        default:
          throw ApiException('Unsupported method $method');
      }
      
      stopwatch.stop();
      
      // Log successful response
      logger.logNetworkResponse(
        method,
        path,
        statusCode: response.statusCode,
        response: response.body,
        durationMs: stopwatch.elapsedMilliseconds,
      );

      if (response.statusCode == 401) {
        logger.logAuthError('Unauthorized', 'Session expired');
        await tokenProvider.logout();
        throw ApiException('Session expired', statusCode: 401);
      }
      
      if (response.statusCode < 200 || response.statusCode >= 300) {
        final decoded = _tryDecode(response.body);
        final detail = decoded is Map<String, dynamic>
            ? (decoded['detail'] ?? decoded['message'] ?? 'Request failed')
            : 'Request failed';
        logger.error('API Error: $detail (Status: ${response.statusCode})');
        throw ApiException('$detail', statusCode: response.statusCode);
      }
      
      if (response.body.trim().isEmpty) return null;
      return _tryDecode(response.body);
    } on SocketException catch (e, st) {
      logger.logNetworkError(method, path, error: e, stackTrace: st);
      if (queueIfOffline && _isMutation(method)) {
        logger.info('📋 Queued mutation for offline sync: $method $path');
        await OfflineQueueService.instance.enqueue(method, path, body);
        return {'_offline_queued': true};
      }
      rethrow;
    } on TimeoutException catch (e, st) {
      logger.logNetworkError(method, path, error: 'Network timeout', stackTrace: st);
      throw ApiException('Network timeout');
    } catch (e, st) {
      logger.logNetworkError(method, path, error: e, stackTrace: st);
      rethrow;
    }
  }

  bool _isMutation(String method) {
    final m = method.toUpperCase();
    return m == 'POST' || m == 'PUT' || m == 'PATCH' || m == 'DELETE';
  }

  dynamic _tryDecode(String raw) {
    try {
      return jsonDecode(raw);
    } catch (_) {
      return raw;
    }
  }
}

