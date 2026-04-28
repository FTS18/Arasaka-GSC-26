import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';

class AIInsightPage extends StatefulWidget {
  const AIInsightPage({super.key});

  @override
  State<AIInsightPage> createState() => _AIInsightPageState();
}

class _AIInsightPageState extends State<AIInsightPage> {
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, String>> _messages = [];
  bool _loading = false;

  Future<void> _sendQuery() async {
    final query = _controller.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'content': query});
      _loading = true;
    });
    _controller.clear();

    try {
      final response = await context.read<AuthProvider>().api.request(
        'POST',
        '/ai/insight',
        body: {'query': query},
      );

      final insight = readString(response, 'insight') ?? 'No data returned';

      if (mounted) {
        setState(() {
          _messages.add({'role': 'assistant', 'content': insight});
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add({'role': 'assistant', 'content': 'Error: $e'});
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gemini Tactical AI'),
        backgroundColor: AppColors.darkSurface,
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final m = _messages[index];
                final isUser = m['role'] == 'user';
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isUser
                        ? AppColors.surfaceAlt
                        : AppColors.darkSurface,
                    border: Border.all(
                      color: isUser
                          ? AppColors.borderDefault
                          : AppColors.primary.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isUser ? 'Operator' : 'Gemini System',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: isUser ? Colors.white54 : AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        m['content'] ?? '',
                        style: const TextStyle(fontSize: 14, height: 1.4),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          if (_loading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: LinearProgressIndicator(
                backgroundColor: Colors.transparent,
              ),
            ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: AppColors.darkSurface,
              border: Border(top: BorderSide(color: AppColors.borderDefault)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: const InputDecoration(
                      hintText: 'Type operational query...',
                      border: InputBorder.none,
                    ),
                    onSubmitted: (_) => _sendQuery(),
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.send_rounded,
                    color: AppColors.primary,
                  ),
                  onPressed: _sendQuery,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
