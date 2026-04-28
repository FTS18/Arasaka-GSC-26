import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_marker_cluster/flutter_map_marker_cluster.dart';
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
    final lowData = context.watch<AuthProvider>().lowDataMode;
    final center = needs.isNotEmpty
        ? LatLng(readNum(asMap(needs.first['location']), 'lat').toDouble(),
            readNum(asMap(needs.first['location']), 'lng').toDouble())
        : const LatLng(28.6139, 77.2090);

    // Grayscale / Tactical Tile for Low Data
    final tileUrl = lowData
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Tactical Ops Map'),
        actions: [
          IconButton(onPressed: load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: [
                      FilterChip(
                        label: const Text('Needs'),
                        selected: needsLayer,
                        onSelected: (v) => setState(() => needsLayer = v),
                        selectedColor: AppColors.danger.withValues(alpha: 0.2),
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Volunteers'),
                        selected: volunteersLayer,
                        onSelected: (v) => setState(() => volunteersLayer = v),
                        selectedColor: Colors.blue.withValues(alpha: 0.2),
                      ),
                      const SizedBox(width: 8),
                      FilterChip(
                        label: const Text('Resources'),
                        selected: resourcesLayer,
                        onSelected: (v) => setState(() => resourcesLayer = v),
                        selectedColor: AppColors.warning.withValues(alpha: 0.2),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: FlutterMap(
                    options: MapOptions(initialCenter: center, initialZoom: 11),
                    children: [
                      TileLayer(
                        urlTemplate: tileUrl,
                        subdomains: const ['a', 'b', 'c'],
                      ),
                      if (needsLayer)
                        MarkerClusterLayerWidget(
                          options: MarkerClusterLayerOptions(
                            maxClusterRadius: 45,
                            size: const Size(40, 40),
                            alignment: Alignment.center,
                            padding: const EdgeInsets.all(50),
                            markers: needs.map((n) {
                              final l = asMap(n['location']);
                              return Marker(
                                point: LatLng(readNum(l, 'lat').toDouble(),
                                    readNum(l, 'lng').toDouble()),
                                width: 32,
                                height: 32,
                                child: const Icon(Icons.location_on,
                                    color: AppColors.danger),
                              );
                            }).toList(),
                            builder: (context, markers) {
                              return Container(
                                decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(20),
                                    color: AppColors.danger),
                                child: Center(
                                  child: Text(
                                    markers.length.toString(),
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                      if (volunteersLayer || resourcesLayer)
                        MarkerLayer(
                          markers: [
                            if (volunteersLayer)
                              ...volunteers.map((v) {
                                final l = asMap(v['base_location']);
                                return Marker(
                                  point: LatLng(readNum(l, 'lat').toDouble(),
                                      readNum(l, 'lng').toDouble()),
                                  width: 28,
                                  height: 28,
                                  child: const Icon(Icons.person_pin_circle,
                                      color: Colors.blue),
                                );
                              }),
                            if (resourcesLayer)
                              ...resources.map((r) {
                                final l = asMap(r['location']);
                                return Marker(
                                  point: LatLng(readNum(l, 'lat').toDouble(),
                                      readNum(l, 'lng').toDouble()),
                                  width: 26,
                                  height: 26,
                                  child: const Icon(Icons.inventory,
                                      color: AppColors.warning),
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
