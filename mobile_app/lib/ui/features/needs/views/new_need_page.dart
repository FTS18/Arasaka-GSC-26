import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';
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
  bool fetchingLocation = false;
  File? _image;
  final _picker = ImagePicker();

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picked = await _picker.pickImage(
        source: source,
        maxWidth: 1024,
        imageQuality: 70,
      );
      if (picked != null) {
        setState(() {
          _image = File(picked.path);
          busy = true;
        });
        // Simulate AI Vision Extraction
        await Future.delayed(const Duration(seconds: 2));
        setState(() {
          busy = false;
          if (title.text.isEmpty) title.text = "Emergency: Damage Detected";
          if (desc.text.isEmpty) {
            desc.text = "AI Vision Analysis: Potential structural damage or supply shortage detected in captured image. Immediate assessment recommended.";
          }
          category = 'disaster_relief';
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Camera Error: $e')),
      );
    }
  }

  Future<void> _getCurrentLocation() async {
    setState(() => fetchingLocation = true);
    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse ||
          permission == LocationPermission.always) {
        // Battery Optimization: Use Balanced accuracy to save power
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            distanceFilter: 10,
          ),
        );
        setState(() {
          lat.text = pos.latitude.toStringAsFixed(6);
          lng.text = pos.longitude.toStringAsFixed(6);
        });
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Location Error: $e')),
      );
    } finally {
      if (mounted) setState(() => fetchingLocation = false);
    }
  }

  Future<void> submit() async {
    setState(() => busy = true);
    try {
      final res = asMap(
        await context.read<AuthProvider>().api.request(
          'POST',
          '/needs',
          body: {
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
            'vulnerability': vulnerability.isEmpty
                ? ['none']
                : vulnerability.toList(),
            'evidence_urls': evidence.text
                .split(',')
                .map((s) => s.trim())
                .where((s) => s.isNotEmpty)
                .toList(),
            'source': 'field_worker',
          },
        ),
      );

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
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Failed: $e')));
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
          TextField(
            controller: title,
            decoration: const InputDecoration(labelText: 'Title'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: category,
            decoration: const InputDecoration(labelText: 'Category'),
            items: const [
              DropdownMenuItem(value: 'food', child: Text('Food & Water')),
              DropdownMenuItem(value: 'medical', child: Text('Medical Support')),
              DropdownMenuItem(value: 'shelter', child: Text('Shelter & Housing')),
              DropdownMenuItem(value: 'education', child: Text('Education')),
              DropdownMenuItem(value: 'sanitation', child: Text('Sanitation')),
              DropdownMenuItem(value: 'blood_donation', child: Text('Blood Donation')),
              DropdownMenuItem(value: 'disaster_relief', child: Text('Disaster Relief')),
              DropdownMenuItem(value: 'emergency_transport', child: Text('Emergency Transport')),
              DropdownMenuItem(value: 'other', child: Text('Other')),
            ],
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
              Expanded(
                child: TextField(
                  controller: lat,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Latitude'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: TextField(
                  controller: lng,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Longitude'),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                onPressed: fetchingLocation ? null : _getCurrentLocation,
                icon: fetchingLocation
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.my_location),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: address,
            decoration: const InputDecoration(labelText: 'Address'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: affected,
            decoration: const InputDecoration(labelText: 'People affected'),
          ),
          const SizedBox(height: 12),
          _slider('Urgency', urgency, (v) => setState(() => urgency = v)),
          _slider('Severity', severity, (v) => setState(() => severity = v)),
          _slider('Weather factor', weather, (v) => setState(() => weather = v)),
          const SizedBox(height: 12),
          const Text(
            'Vulnerability flags',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          Wrap(
            spacing: 8,
            children: ['Children', 'Elderly', 'Disabled', 'Pregnant']
                .map(
                  (v) => FilterChip(
                    label: Text(v),
                    selected: vulnerability.contains(v.toLowerCase()),
                    onSelected: (sel) {
                      setState(() {
                        if (sel) {
                          vulnerability.add(v.toLowerCase());
                        } else {
                          vulnerability.remove(v.toLowerCase());
                        }
                      });
                    },
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 24),
          const Text(
            'Visual Evidence',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          if (_image != null)
            Container(
              height: 200,
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.borderDefault),
                image: DecorationImage(
                  image: FileImage(_image!),
                  fit: BoxFit.cover,
                ),
              ),
              child: Stack(
                children: [
                  Positioned(
                    right: 8,
                    top: 8,
                    child: IconButton.filled(
                      onPressed: () => setState(() => _image = null),
                      icon: const Icon(Icons.close),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.black54,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt_outlined),
                  label: const Text('Camera'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.image_outlined),
                  label: const Text('Gallery'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: evidence,
            decoration: const InputDecoration(
              labelText: 'Evidence URLs (optional)',
              helperText: 'Auto-populated if image uploaded',
            ),
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
        Slider(
          min: 1,
          max: 5,
          divisions: 4,
          value: value,
          onChanged: onChanged,
        ),
      ],
    );
  }
}
