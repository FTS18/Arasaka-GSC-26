import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';
import '../../../core/widgets.dart';

class VolunteerDashboardPage extends StatefulWidget {
  const VolunteerDashboardPage({super.key});

  @override
  State<VolunteerDashboardPage> createState() => _VolunteerDashboardPageState();
}

class _VolunteerDashboardPageState extends State<VolunteerDashboardPage> {
  bool loading = true;
  Map<String, dynamic> stats = {};
  List<Map<String, dynamic>> recentAssignments = [];

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final auth = context.read<AuthProvider>();
      final st = asMap(await auth.api.request('GET', '/dashboard/stats'));
      final missions = asList(await auth.api.request('GET', '/missions', query: {'limit': 5}));
      stats = st;
      recentAssignments = missions;
    } catch (_) {
      stats = {};
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());

    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Tactical Header
          Container(
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              color: AppColors.darkSurface,
              borderRadius: BorderRadius.zero,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('STATUS: ACTIVE_DUTY', style: TextStyle(color: AppColors.success, fontSize: 10, fontWeight: FontWeight.w900, fontFamily: 'monospace')),
                      const SizedBox(height: 4),
                      Text(
                        context.watch<AuthProvider>().user?.name.toUpperCase() ?? 'OPERATOR',
                        style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -1.0),
                      ),
                      const SizedBox(height: 4),
                      const Text('VOLUNTEER_UNIT_4 // FIELD_OPERATIONS', style: TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(border: Border.all(color: Colors.white24)),
                  child: const Icon(Icons.qr_code, color: Colors.white, size: 32),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'FIELD_INTEL_SUMMARY',
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2.0, color: AppColors.secondaryText),
          ),
          const SizedBox(height: 12),
          statWrap([
            statCard('Global Active', readInt(stats, 'active_needs').toString(), AppColors.info),
            statCard('Critical', readInt(stats, 'critical_needs').toString(), AppColors.critical),
            statCard('Unit Size', readInt(stats, 'active_volunteers').toString(), AppColors.secondary),
            statCard('Impact', readInt(stats, 'resolved_needs').toString(), AppColors.success),
          ]),
          const SizedBox(height: 32),
          Row(
            children: [
              const Text('MISSION_DIRECTIVES', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
              const Spacer(),
              Text('${recentAssignments.length} ASSIGNED', style: const TextStyle(fontSize: 10, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: AppColors.primary)),
            ],
          ),
          const SizedBox(height: 12),
          if (recentAssignments.isEmpty)
            Container(
              padding: const EdgeInsets.all(48),
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt.withOpacity(0.3),
                border: Border.all(color: AppColors.borderDefault),
              ),
              child: const Column(
                children: [
                  Icon(Icons.radar, color: AppColors.mutedText, size: 48),
                  SizedBox(height: 16),
                  Text('SCANNING_FOR_LOCAL_ASSIGNMENTS...', style: TextStyle(fontSize: 10, color: AppColors.mutedText, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                ],
              ),
            )
          else
            ...recentAssignments.map((m) {
              final status = readString(m, 'status') ?? 'PENDING';
              return CommandCard(
                title: (readString(m, 'title') ?? 'MISSION_DIRECTIVE').toUpperCase(),
                status: status,
                subtitle: Text(
                  (readString(m, 'description') ?? '-').toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 10, color: AppColors.secondaryText, fontWeight: FontWeight.bold),
                ),
              );
            }),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.map_outlined),
              label: const Text('OPEN_TACTICAL_MAP'),
            ),
          ),
        ],
      ),
    );
  }
}
