import 'package:flutter/material.dart';
import '../../../../data/services/logger_service.dart';

class DebugLogsScreen extends StatefulWidget {
  const DebugLogsScreen({super.key});

  @override
  State<DebugLogsScreen> createState() => _DebugLogsScreenState();
}

class _DebugLogsScreenState extends State<DebugLogsScreen> {
  late final LoggerService _logger;
  final ScrollController _scrollController = ScrollController();
  late Future<void> _refreshFuture;

  @override
  void initState() {
    super.initState();
    _logger = LoggerService.instance;
    _refreshFuture = Future.value();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Debug Logs'),
        backgroundColor: Colors.black87,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Clear logs',
            onPressed: () {
              setState(() {
                _logger.clearLogs();
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Logs cleared'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: () {
              setState(() {
                _scrollToBottom();
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            color: Colors.black87,
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.blue[400], size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Last ${_logger.getLogs().length} logs',
                    style: TextStyle(
                      color: Colors.blue[400],
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _logger.getLogs().isEmpty
                ? Center(
                    child: Text(
                      'No logs yet',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(8),
                    itemCount: _logger.getLogs().length,
                    itemBuilder: (context, index) {
                      final log = _logger.getLogs()[index];
                      return _LogEntry(log: log);
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _LogEntry extends StatelessWidget {
  final String log;

  const _LogEntry({required this.log});

  Color _getLogColor() {
    if (log.contains('ERROR') || log.contains('WTF') || log.contains('❌')) {
      return Colors.red[700]!;
    }
    if (log.contains('WARN')) {
      return Colors.orange[700]!;
    }
    if (log.contains('INFO') || log.contains('✅')) {
      return Colors.green[700]!;
    }
    if (log.contains('AUTH') || log.contains('🔐')) {
      return Colors.purple[700]!;
    }
    if (log.contains('NETWORK') || log.contains('📤') || log.contains('📥')) {
      return Colors.blue[700]!;
    }
    return Colors.grey[700]!;
  }

  IconData _getLogIcon() {
    if (log.contains('ERROR') || log.contains('WTF')) {
      return Icons.error_outline;
    }
    if (log.contains('WARN')) {
      return Icons.warning_outlined;
    }
    if (log.contains('✅')) {
      return Icons.check_circle_outline;
    }
    if (log.contains('❌')) {
      return Icons.cancel_outlined;
    }
    if (log.contains('🔐') || log.contains('AUTH')) {
      return Icons.lock_outline;
    }
    if (log.contains('📤')) {
      return Icons.upload_outlined;
    }
    if (log.contains('📥')) {
      return Icons.download_outlined;
    }
    return Icons.info_outline;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        border: Border(
          left: BorderSide(
            color: _getLogColor(),
            width: 3,
          ),
        ),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            _getLogIcon(),
            size: 16,
            color: _getLogColor(),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SelectableText(
              log,
              style: TextStyle(
                color: _getLogColor(),
                fontSize: 11,
                fontFamily: 'Courier',
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
