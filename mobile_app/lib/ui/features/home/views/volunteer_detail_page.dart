import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';

class VolunteerDetailPage extends StatefulWidget {
  const VolunteerDetailPage({super.key, required this.volunteerId});
  final String volunteerId;

  @override
  State<VolunteerDetailPage> createState() => _VolunteerDetailPageState();
}

class _VolunteerDetailPageState extends State<VolunteerDetailPage> {
  bool loading = true;
  Map<String, dynamic> volunteer = {};

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      volunteer = asMap(await context.read<AuthProvider>().api.request('GET', '/volunteers/${widget.volunteerId}'));
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    return Scaffold(
      appBar: AppBar(title: Text(readString(volunteer, 'name') ?? 'Volunteer')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            title: const Text('Trust score'),
            trailing: Text('${(readNum(volunteer, 'trust_score')).round()}'),
          ),
          ListTile(
            title: const Text('Completed missions'),
            trailing: Text('${readInt(volunteer, 'completed_missions')}'),
          ),
          ListTile(
            title: const Text('Availability'),
            trailing: Text(readString(volunteer, 'availability') ?? '-'),
          ),
          const SizedBox(height: 8),
          const Text('Skills', style: TextStyle(fontWeight: FontWeight.w700)),
          Wrap(
            spacing: 8,
            children: asListOfString(volunteer['skills'])
                .map((s) => Chip(label: Text(s)))
                .toList(),
          ),
        ],
      ),
    );
  }
}




