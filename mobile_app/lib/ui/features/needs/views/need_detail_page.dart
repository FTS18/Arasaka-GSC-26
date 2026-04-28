import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';
import '../../../core/widgets.dart';

class NeedDetailPage extends StatefulWidget {
  final String needId;
  const NeedDetailPage({super.key, required this.needId});

  @override
  State<NeedDetailPage> createState() => _NeedDetailPageState();
}

class _NeedDetailPageState extends State<NeedDetailPage> {
  bool loading = true;
  Map<String, dynamic>? need;

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final auth = context.read<AuthProvider>();
      final res = asMap(
        await auth.api.request('GET', '/needs/${widget.needId}'),
      );
      need = res;
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthProvider>().user?.role ?? 'user';
    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (need == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(child: Text('Record Not Found')),
      );
    }

    final status = readString(need, 'status') ?? 'UNKNOWN';
    final urgency = readInt(need, 'urgency');
    final lat = readNum(need, 'lat').toDouble();
    final lng = readNum(need, 'lng').toDouble();

    Color statusColor = AppColors.secondaryText;
    if (status == 'pending') statusColor = AppColors.warning;
    if (status == 'assigned') statusColor = AppColors.info;
    if (status == 'in_progress') statusColor = AppColors.primary;
    if (status == 'completed') statusColor = AppColors.success;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Field Report: ${widget.needId.substring(0, widget.needId.length > 8 ? 8 : widget.needId.length)}',
        ),
        actions: [
          IconButton(icon: const Icon(Icons.share_outlined), onPressed: () {}),
        ],
      ),
      body: ListView(
        children: [
          SizedBox(
            height: 200,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: LatLng(lat, lng),
                initialZoom: 14,
              ),
              children: [
                TileLayer(
                  urlTemplate:
                      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  subdomains: const ['a', 'b', 'c'],
                ),
                MarkerLayer(
                  markers: [
                    Marker(
                      point: LatLng(lat, lng),
                      width: 40,
                      height: 40,
                      child: Icon(
                        Icons.location_on,
                        color: urgency >= 4
                            ? AppColors.critical
                            : AppColors.primary,
                        size: 40,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    TacticalBadge(
                      text:
                          status[0].toUpperCase() +
                          status.substring(1).toLowerCase(),
                      color: statusColor,
                    ),
                    const SizedBox(width: 8),
                    TacticalBadge(
                      text: 'Urgency: U$urgency',
                      color: urgency >= 4
                          ? AppColors.critical
                          : AppColors.secondaryText,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  readString(need, 'title') ?? 'Untitled Report',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -1.0,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Category: ${readString(need, 'category') ?? 'General'}',
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppColors.secondaryText,
                  ),
                ),
                const Divider(
                  height: 32,
                  thickness: 1,
                  color: AppColors.borderDefault,
                ),
                const Text(
                  'Description',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.0,
                    color: AppColors.secondaryText,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  readString(need, 'description') ?? 'No description provided.',
                  style: const TextStyle(fontSize: 15, height: 1.5),
                ),
                const SizedBox(height: 32),
                if (role == 'volunteer' && status.toLowerCase() == 'pending')
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        try {
                          final auth = context.read<AuthProvider>();
                          await auth.api.request(
                            'POST',
                            '/needs/${readString(need, 'id')}/claim',
                          );
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Mission claimed successfully'),
                            ),
                          );
                          if (!context.mounted) return;
                          Navigator.pop(context); // Go back after claiming
                        } catch (e) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Failed to claim mission: $e'),
                            ),
                          );
                        }
                      },
                      child: const Text('Accept Field Mission'),
                    ),
                  ),
                if (status.toLowerCase() == 'assigned' ||
                    status.toLowerCase() == 'in_progress')
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {},
                      child: const Text('Update Mission Status'),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
