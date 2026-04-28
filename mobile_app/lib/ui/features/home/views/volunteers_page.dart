import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import 'volunteer_detail_page.dart';

class VolunteersPage extends StatefulWidget {
  const VolunteersPage({super.key});

  @override
  State<VolunteersPage> createState() => _VolunteersPageState();
}

class _VolunteersPageState extends State<VolunteersPage> {
  bool loading = true;
  String availability = '';
  String city = '';
  List<Map<String, dynamic>> volunteers = [];

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() => loading = true);
    try {
      volunteers = asList(
        await context.read<AuthProvider>().api.request('GET', '/volunteers', query: {
          if (availability.isNotEmpty) 'availability': availability,
          if (city.isNotEmpty) 'city': city,
          'projection': 'short',
        }),
      );
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Volunteers')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: availability.isEmpty ? null : availability,
                  items: const [
                    DropdownMenuItem(value: 'available', child: Text('Available')),
                    DropdownMenuItem(value: 'busy', child: Text('Busy')),
                  ],
                  onChanged: (v) {
                    setState(() => availability = v ?? '');
                    load();
                  },
                  decoration: const InputDecoration(labelText: 'Availability'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  decoration: const InputDecoration(labelText: 'City'),
                  onChanged: (v) {
                    city = v;
                  },
                  onSubmitted: (_) => load(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (loading) const Center(child: CircularProgressIndicator()),
          ...volunteers.map((v) => Card(
                child: ListTile(
                  title: Text(readString(v, 'name') ?? '-'),
                  subtitle: Text(
                    '${readString(v, 'availability') ?? '-'} · trust ${(readNum(v, 'trust_score')).round()}',
                  ),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => VolunteerDetailPage(volunteerId: readString(v, 'id') ?? ''),
                    ),
                  ),
                ),
              )),
        ],
      ),
    );
  }
}




