import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';

class ResourcesPage extends StatefulWidget {
  const ResourcesPage({super.key});

  @override
  State<ResourcesPage> createState() => _ResourcesPageState();
}

class _ResourcesPageState extends State<ResourcesPage> {
  bool loading = true;
  List<Map<String, dynamic>> resources = [];
  final search = TextEditingController();

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() => loading = true);
    final api = context.read<AuthProvider>().api;
    final prefs = await SharedPreferences.getInstance();
    final now = DateTime.now().millisecondsSinceEpoch;
    final bundleRaw = prefs.getString('bundle_resources');
    final ts = prefs.getInt('bundle_resources_ts') ?? 0;

    if (bundleRaw != null && now - ts < 3600000) {
      resources = asList(jsonDecode(bundleRaw));
      if (mounted) setState(() => loading = false);
      return;
    }

    try {
      final bundle = asMap(await api.request('GET', '/api/system/bundle/resources'));
      final data = asList(bundle['data']);
      if (data.isNotEmpty) {
        resources = data;
        await prefs.setString('bundle_resources', jsonEncode(data));
        await prefs.setInt('bundle_resources_ts', now);
      } else {
        resources = asList(await api.request('GET', '/resources'));
      }
    } catch (_) {
      resources = asList(await api.request('GET', '/resources'));
    }

    if (mounted) setState(() => loading = false);
  }

  Future<void> requisition(Map<String, dynamic> r) async {
    try {
      await context.read<AuthProvider>().api.request(
            'PATCH',
            '/resources/${readString(r, 'id')}',
            body: {'quantity': readInt(r, 'quantity') + 20},
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Requisition created')));
      load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = resources.where((r) {
      final q = search.text.toLowerCase();
      return (readString(r, 'name') ?? '').toLowerCase().contains(q) ||
          (readString(r, 'category') ?? '').toLowerCase().contains(q) ||
          (readString(r, 'warehouse') ?? '').toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Resources')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            controller: search,
            onChanged: (_) => setState(() {}),
            decoration: const InputDecoration(prefixIcon: Icon(Icons.search), labelText: 'Search resources'),
          ),
          const SizedBox(height: 12),
          if (loading) const Center(child: CircularProgressIndicator()),
          ...filtered.map((r) {
            final low = readInt(r, 'quantity') <= readInt(r, 'min_threshold') || readInt(r, 'quantity') < 10;
            return Card(
              child: ListTile(
                title: Text(readString(r, 'name') ?? '-'),
                subtitle: Text('${readString(r, 'warehouse') ?? '-'} · ${readString(r, 'category') ?? '-'}'),
                trailing: low
                    ? ElevatedButton(onPressed: () => requisition(r), child: const Text('Requisition'))
                    : Text('${readInt(r, 'quantity')}'),
              ),
            );
          }),
        ],
      ),
    );
  }
}




