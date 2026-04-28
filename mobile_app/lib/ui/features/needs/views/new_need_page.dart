import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import 'need_detail_page.dart';

class NewNeedPage extends StatefulWidget {
  const NewNeedPage({super.key});

  @override
  State<NewNeedPage> createState() => _NewNeedPageState();
}

class _NewNeedPageState extends State<NewNeedPage> {
  bool busy = false;
  final title = TextEditingController();
  final desc = TextEditingController();
  final address = TextEditingController();
  final lat = TextEditingController(text: '28.6139');
  final lng = TextEditingController(text: '77.2090');
  final affected = TextEditingController(text: '10');
  String category = 'food';
  double urgency = 3;
  double severity = 3;
  double weather = 1;
  final Set<String> vulnerability = {};
  final evidence = TextEditingController();

  Future<void> submit() async {
    setState(() => busy = true);
    try {
      final res = asMap(await context.read<AuthProvider>().api.request('POST', '/needs', body: {
        'title': title.text.trim(),
        'category': category,
        'description': desc.text.trim(),
        'location': {
          'lat': double.tryParse(lat.text) ?? 28.6139,
          'lng': double.tryParse(lng.text) ?? 77.2090,
          'address': address.text.trim(),
        },
        'urgency': urgency.toInt(),
        'people_affected': int.tryParse(affected.text) ?? 1,
        'severity': severity.toInt(),
        'weather_factor': weather.toInt(),
        'vulnerability': vulnerability.isEmpty ? ['none'] : vulnerability.toList(),
        'evidence_urls': evidence.text
            .split(',')
            .map((s) => s.trim())
            .where((s) => s.isNotEmpty)
            .toList(),
        'source': 'field_worker',
      }));

      if (!mounted) return;
      final id = readString(res, 'id');
      if (id != null && id.isNotEmpty) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => NeedDetailPage(needId: id)),
        );
      } else {
        Navigator.pop(context);
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $e')));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Need Request')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(controller: title, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: category,
            decoration: const InputDecoration(labelText: 'Category'),
            items: const [
              'food',
              'medical',
              'shelter',
              'education',
              'sanitation',
              'blood_donation',
              'disaster_relief',
              'emergency_transport',
              'other',
            ]
                .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                .toList(),
            onChanged: (v) => setState(() => category = v ?? 'food'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: desc,
            maxLines: 4,
            decoration: const InputDecoration(labelText: 'Description'),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: TextField(controller: lat, decoration: const InputDecoration(labelText: 'Latitude'))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: lng, decoration: const InputDecoration(labelText: 'Longitude'))),
            ],
          ),
          const SizedBox(height: 12),
          TextField(controller: address, decoration: const InputDecoration(labelText: 'Address')),
          const SizedBox(height: 12),
          TextField(controller: affected, decoration: const InputDecoration(labelText: 'People affected')),
          const SizedBox(height: 12),
          _slider('Urgency', urgency, (v) => setState(() => urgency = v)),
          _slider('Severity', severity, (v) => setState(() => severity = v)),
          _slider('Weather factor', weather, (v) => setState(() => weather = v)),
          const SizedBox(height: 12),
          const Text('Vulnerability flags', style: TextStyle(fontWeight: FontWeight.w600)),
          Wrap(
            spacing: 8,
            children: ['children', 'elderly', 'disabled', 'pregnant']
                .map((v) => FilterChip(
                      label: Text(v),
                      selected: vulnerability.contains(v),
                      onSelected: (sel) {
                        setState(() {
                          if (sel) {
                            vulnerability.add(v);
                          } else {
                            vulnerability.remove(v);
                          }
                        });
                      },
                    ))
                .toList(),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: evidence,
            decoration: const InputDecoration(labelText: 'Evidence URLs (comma separated)'),
          ),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: busy ? null : submit,
            child: Text(busy ? 'Submitting...' : 'File request'),
          ),
        ],
      ),
    );
  }

  Widget _slider(String label, double value, ValueChanged<double> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('$label: ${value.toInt()}'),
        Slider(min: 1, max: 5, divisions: 4, value: value, onChanged: onChanged),
      ],
    );
  }
}




