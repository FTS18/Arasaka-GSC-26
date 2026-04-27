import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';

class MissionsPage extends StatefulWidget {
  const MissionsPage({super.key});

  @override
  State<MissionsPage> createState() => _MissionsPageState();
}

class _MissionsPageState extends State<MissionsPage> {
  bool loading = true;
  List<Map<String, dynamic>> missions = [];

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() => loading = true);
    try {
      missions = asList(await context.read<AuthProvider>().api.request('GET', '/missions'));
    } catch (_) {
      missions = [];
    }
    if (mounted) setState(() => loading = false);
  }

  Future<void> completeMission(Map<String, dynamic> m) async {
    final notesController = TextEditingController(text: 'Completed via mobile');
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Complete mission'),
        content: TextField(
          controller: notesController,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Completion notes'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await context.read<AuthProvider>().api.request(
                      'POST',
                      '/missions/${readString(m, 'id')}/complete',
                      body: {
                        'proof_urls': asListOfString(m['proof_urls']),
                        'completion_notes': notesController.text.trim(),
                      },
                    );
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Mission completed')),
                );
                load();
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
              }
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Missions', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          ...missions.map((m) => Card(
                child: ListTile(
                  title: Text('Mission ${(readString(m, 'id') ?? '').substring(0, (readString(m, 'id') ?? '').length > 8 ? 8 : (readString(m, 'id') ?? '').length)}'),
                  subtitle: Text('Status: ${readString(m, 'status') ?? 'planned'}'),
                  trailing: (readString(m, 'status') == 'completed')
                      ? const Icon(Icons.check_circle, color: AppColors.ok)
                      : ElevatedButton(
                          onPressed: () => completeMission(m),
                          child: const Text('Complete'),
                        ),
                ),
              )),
        ],
      ),
    );
  }
}




