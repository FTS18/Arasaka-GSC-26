import 'package:logger/logger.dart';

/// Centralized logging service for the entire app
class LoggerService {
  static final LoggerService _instance = LoggerService._internal();
  static LoggerService get instance => _instance;
  late Logger _logger;
  final List<String> _logBuffer = [];
  static const int _maxLogs = 500; // Keep last 500 logs in memory

  factory LoggerService() {
    return _instance;
  }

  LoggerService._internal() {
    _logger = Logger(
      printer: PrettyPrinter(
        methodCount: 2,
        errorMethodCount: 5,
        lineLength: 120,
        colors: true,
        printEmojis: true,
        dateTimeFormat: DateTimeFormat.onlyTimeAndSinceStart,
      ),
      filter: ProductionFilter(),
    );
  }

  /// Get all buffered logs
  List<String> getLogs() => List.from(_logBuffer);

  /// Clear all buffered logs
  void clearLogs() => _logBuffer.clear();

  /// Add log entry to buffer
  void _addToBuffer(String message) {
    final timestamp = DateTime.now().toIso8601String();
    final logEntry = '[$timestamp] $message';
    _logBuffer.add(logEntry);

    // Keep buffer size manageable
    if (_logBuffer.length > _maxLogs) {
      _logBuffer.removeAt(0);
    }
  }

  // ============ PUBLIC LOGGING METHODS ============

  void verbose(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.v(message, error: error, stackTrace: stackTrace);
    _addToBuffer('V: $message');
  }

  void debug(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.d(message, error: error, stackTrace: stackTrace);
    _addToBuffer('D: $message');
  }

  void info(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.i(message, error: error, stackTrace: stackTrace);
    _addToBuffer('I: $message');
  }

  void warning(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.w(message, error: error, stackTrace: stackTrace);
    _addToBuffer('W: $message');
  }

  void error(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.e(message, error: error, stackTrace: stackTrace);
    _addToBuffer('E: $message${error != null ? ' - $error' : ''}');
  }

  void wtf(String message, {dynamic error, StackTrace? stackTrace}) {
    _logger.wtf(message, error: error, stackTrace: stackTrace);
    _addToBuffer('WTF: $message');
  }

  // ============ NETWORK LOGGING ============

  void logNetworkRequest(
    String method,
    String path, {
    Map<String, dynamic>? headers,
    dynamic body,
  }) {
    final cleanBody = _sanitizeBody(body);
    info('📤 REQUEST: $method $path');
    if (cleanBody != null) debug('  Body: $cleanBody');
  }

  void logNetworkResponse(
    String method,
    String path, {
    required int statusCode,
    dynamic response,
    int? durationMs,
  }) {
    final cleanResponse = _sanitizeBody(response);
    final duration = durationMs != null ? ' (${durationMs}ms)' : '';
    final emoji = statusCode >= 200 && statusCode < 300 ? '📥' : '❌';
    info('$emoji RESPONSE: $statusCode $method $path$duration');
    if (cleanResponse != null) debug('  Response: $cleanResponse');
  }

  void logNetworkError(
    String method,
    String path, {
    required dynamic error,
    StackTrace? stackTrace,
    int? durationMs,
  }) {
    final duration = durationMs != null ? ' (${durationMs}ms)' : '';
    this.error('🔌 NETWORK ERROR: $method $path$duration', error: error, stackTrace: stackTrace);
  }

  // ============ AUTH LOGGING ============

  void logAuthEvent(String event, {Map<String, dynamic>? details}) {
    final detailsStr = details != null ? ' - ${_sanitizeBody(details)}' : '';
    info('🔐 AUTH: $event$detailsStr');
  }

  void logAuthError(String event, dynamic error, [StackTrace? stackTrace]) {
    this.error('🔐 AUTH ERROR: $event', error: error, stackTrace: stackTrace);
  }

  // ============ UTILITY METHODS ============

  /// Sanitize sensitive data before logging
  dynamic _sanitizeBody(dynamic body) {
    if (body == null) return null;

    if (body is String) {
      return _sanitizeString(body);
    }

    if (body is Map) {
      final sanitized = <String, dynamic>{};
      body.forEach((key, value) {
        if (_isSensitiveKey(key)) {
          sanitized[key] = '***REDACTED***';
        } else if (value is String) {
          sanitized[key] = _sanitizeString(value);
        } else {
          sanitized[key] = value;
        }
      });
      return sanitized;
    }

    if (body is List) {
      return body.map((item) => _sanitizeBody(item)).toList();
    }

    return body;
  }

  bool _isSensitiveKey(String key) {
    final sensitive = [
      'password',
      'token',
      'secret',
      'apikey',
      'api_key',
      'authorization',
      'auth',
      'credential',
      'credentials',
      'pin',
      'otp',
    ];
    return sensitive.any((s) => key.toLowerCase().contains(s));
  }

  String _sanitizeString(String str) {
    if (str.length > 100) return '${str.substring(0, 100)}...';
    return str;
  }
}

/// Production filter - in production, exclude verbose/debug logs
class ProductionFilter extends LogFilter {
  @override
  bool shouldLog(LogEvent event) {
    // In production, you might want to filter out verbose/debug
    // For now, log everything for debugging
    return true;
  }
}
