import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
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
      missions = asList(
        await context.read<AuthProvider>().api.request('GET', '/missions'),
      );
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
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
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
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(SnackBar(content: Text('$e')));
              }
            },
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  Future<void> startMission(Map<String, dynamic> m) async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => loading = true);
    try {
      await context.read<AuthProvider>().api.request(
        'POST',
        '/missions/${readString(m, 'id')}/accept',
      );
      messenger.showSnackBar(const SnackBar(content: Text('Mission started')));
      load();
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('$e')));
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Missions',
            style: GoogleFonts.chivo(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              letterSpacing: -1.0,
            ),
          ),
          const SizedBox(height: 8),
          ...missions.map((m) {
            final status = readString(m, 'status');
            final id = readString(m, 'id') ?? '';
            final shortId = id.substring(0, id.length > 8 ? 8 : id.length);

            return Card(
              child: ListTile(
                title: Text('Mission $shortId'),
                subtitle: Text('Status: ${status ?? 'planned'}'),
                trailing: status == 'completed'
                    ? const Icon(Icons.check_circle, color: AppColors.ok)
                    : status == 'planned'
                    ? ElevatedButton(
                        onPressed: () => startMission(m),
                        child: const Text('Start'),
                      )
                    : ElevatedButton(
                        onPressed: () => completeMission(m),
                        child: const Text('Complete'),
                      ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
