import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';

class MapViewPage extends StatefulWidget {
  const MapViewPage({super.key});

  @override
  State<MapViewPage> createState() => _MapViewPageState();
}

class _MapViewPageState extends State<MapViewPage> {
  bool loading = true;
  bool needsLayer = true;
  bool volunteersLayer = true;
  bool resourcesLayer = true;
  List<Map<String, dynamic>> needs = [];
  List<Map<String, dynamic>> volunteers = [];
  List<Map<String, dynamic>> resources = [];

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    setState(() => loading = true);
    final api = context.read<AuthProvider>().api;
    try {
      needs = asList(await api.request('GET', '/needs/markers'));
      volunteers = asList(await api.request('GET', '/volunteers'));
      resources = asList(await api.request('GET', '/resources'));
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final center = needs.isNotEmpty
        ? LatLng(readNum(asMap(needs.first['location']), 'lat').toDouble(), readNum(asMap(needs.first['location']), 'lng').toDouble())
        : const LatLng(28.6139, 77.2090);

    return Scaffold(
      appBar: AppBar(title: const Text('Operations Map')),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Wrap(
                  spacing: 8,
                  children: [
                    FilterChip(
                      label: const Text('Needs'),
                      selected: needsLayer,
                      onSelected: (v) => setState(() => needsLayer = v),
                    ),
                    FilterChip(
                      label: const Text('Volunteers'),
                      selected: volunteersLayer,
                      onSelected: (v) => setState(() => volunteersLayer = v),
                    ),
                    FilterChip(
                      label: const Text('Resources'),
                      selected: resourcesLayer,
                      onSelected: (v) => setState(() => resourcesLayer = v),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: FlutterMap(
                    options: MapOptions(initialCenter: center, initialZoom: 11),
                    children: [
                      TileLayer(
                        urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        subdomains: const ['a', 'b', 'c'],
                      ),
                      MarkerLayer(
                        markers: [
                          if (needsLayer)
                            ...needs.map((n) {
                              final l = asMap(n['location']);
                              return Marker(
                                point: LatLng(readNum(l, 'lat').toDouble(), readNum(l, 'lng').toDouble()),
                                width: 32,
                                height: 32,
                                child: const Icon(Icons.location_on, color: AppColors.danger),
                              );
                            }),
                          if (volunteersLayer)
                            ...volunteers.map((v) {
                              final l = asMap(v['base_location']);
                              return Marker(
                                point: LatLng(readNum(l, 'lat').toDouble(), readNum(l, 'lng').toDouble()),
                                width: 28,
                                height: 28,
                                child: const Icon(Icons.person_pin_circle, color: Colors.blue),
                              );
                            }),
                          if (resourcesLayer)
                            ...resources.map((r) {
                              final l = asMap(r['location']);
                              return Marker(
                                point: LatLng(readNum(l, 'lat').toDouble(), readNum(l, 'lng').toDouble()),
                                width: 26,
                                height: 26,
                                child: const Icon(Icons.inventory, color: AppColors.warning),
                              );
                            }),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}




