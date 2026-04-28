import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';
import '../../../core/widgets.dart';
import '../../ai_assistant/views/ai_insight_page.dart';

class VolunteerDashboardPage extends StatefulWidget {
  const VolunteerDashboardPage({super.key});

  @override
  State<VolunteerDashboardPage> createState() => _VolunteerDashboardPageState();
}

class _VolunteerDashboardPageState extends State<VolunteerDashboardPage> {
  bool loading = true;
  Map<String, dynamic> stats = {};
  List<Map<String, dynamic>> recentAssignments = [];
  Map<String, dynamic> volunteer = {};
  Map<String, dynamic> globalStats = {};

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final auth = context.read<AuthProvider>();
      final st = asMap(await auth.api.request('GET', '/dashboard/stats'));
      final gst = asMap(await auth.api.request('GET', '/stats/global'));
      final missions = asList(
        await auth.api.request('GET', '/missions', query: {'limit': 5}),
      );
      final vol = asMap(await auth.api.request('GET', '/volunteers/me'));

      stats = st;
      globalStats = gst;
      recentAssignments = missions;
      volunteer = vol;
    } catch (_) {
      stats = {};
    }
    if (mounted) setState(() => loading = false);
  }

  Future<void> toggleAvailability() async {
    final currentStatus = readString(volunteer, 'availability');
    final nextStatus = currentStatus == 'available' ? 'busy' : 'available';

    setState(() => loading = true);
    try {
      await context.read<AuthProvider>().api.request(
        'PATCH',
        '/volunteers/me/status',
        body: {'availability': nextStatus},
      );
      await load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Status update failed: $e')));
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    final statusRaw = readString(volunteer, 'availability') ?? 'offline';
    final status = statusRaw.toLowerCase() == 'in_progress'
        ? 'In Progress'
        : (statusRaw.isEmpty
              ? 'Offline'
              : '${statusRaw.toLowerCase()[0].toUpperCase()}${statusRaw.toLowerCase().substring(1)}');

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
                      Text(
                        'Status: ${status[0].toUpperCase()}${status.substring(1)}',
                        style: TextStyle(
                          color: statusRaw == 'available'
                              ? AppColors.success
                              : AppColors.critical,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        context.watch<AuthProvider>().user?.name ?? 'Operator',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -1.0,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Volunteer Unit 4 // Field Operations',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  children: [
                    Switch(
                      value: statusRaw == 'available',
                      onChanged: (_) => toggleAvailability(),
                      activeThumbColor: AppColors.success,
                    ),
                    const Text(
                      'Availability',
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Transform.scale(
                      scale: 0.7,
                      child: Switch(
                        value: context.watch<AuthProvider>().lowDataMode,
                        onChanged: (v) => context.read<AuthProvider>().toggleLowDataMode(v),
                        activeThumbColor: AppColors.info,
                      ),
                    ),
                    const Text(
                      'Low-Data',
                      style: TextStyle(
                        fontSize: 8,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 8),
                    DropdownButton<String>(
                      value: 'en',
                      dropdownColor: AppColors.ink,
                      underline: const SizedBox(),
                      style: const TextStyle(fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold),
                      items: const [
                        DropdownMenuItem(value: 'en', child: Text('EN')),
                        DropdownMenuItem(value: 'hi', child: Text('HI')),
                        DropdownMenuItem(value: 'bn', child: Text('BN')),
                      ],
                      onChanged: (v) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Language switched to $v (Translating Ops Hub...)')),
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Global Impact Ticker',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 2.0,
              color: AppColors.secondaryText,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.05),
              border: Border.all(
                color: AppColors.primary.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _impactItem(
                  'Lives Saved',
                  readInt(globalStats, 'resolved').toString(),
                ),
                _impactItem(
                  'Unit Strength',
                  readInt(globalStats, 'active_volunteers').toString(),
                ),
                _impactItem(
                  'Reliance Score',
                  readInt(globalStats, 'impact_score').toString(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'Field Intel Summary',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 2.0,
              color: AppColors.secondaryText,
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AIInsightPage()),
              ),
              icon: const Icon(Icons.psychology_outlined),
              label: const Text('Ask AI Assistant'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                foregroundColor: AppColors.primary,
                side: const BorderSide(color: AppColors.primary),
              ),
            ),
          ),
          const SizedBox(height: 12),
          statWrap([
            statCard(
              'Global Active',
              readInt(stats, 'active_needs').toString(),
              AppColors.info,
            ),
            statCard(
              'Critical',
              readInt(stats, 'critical_needs').toString(),
              AppColors.critical,
            ),
            statCard(
              'Unit Size',
              readInt(stats, 'active_volunteers').toString(),
              AppColors.secondary,
            ),
            statCard(
              'Impact',
              readInt(stats, 'resolved_needs').toString(),
              AppColors.success,
            ),
          ]),
          const SizedBox(height: 32),
          Row(
            children: [
              const Text(
                'Mission Directives',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              const Spacer(),
              Text(
                '${recentAssignments.length} Assigned',
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (recentAssignments.isEmpty)
            Container(
              padding: const EdgeInsets.all(48),
              decoration: BoxDecoration(
                color: AppColors.surfaceAlt.withValues(alpha: 0.3),
                border: Border.all(color: AppColors.borderDefault),
              ),
              child: const Column(
                children: [
                  Icon(Icons.radar, color: AppColors.mutedText, size: 48),
                  SizedBox(height: 16),
                  Text(
                    'Scanning for local assignments...',
                    style: TextStyle(
                      fontSize: 10,
                      color: AppColors.mutedText,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            )
          else
            ...recentAssignments.map((m) {
              final status = readString(m, 'status') ?? 'pending';
              return CommandCard(
                title: readString(m, 'title') ?? 'Mission Directive',
                status: status,
                subtitle: Text(
                  readString(m, 'description') ?? '-',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppColors.secondaryText,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              );
            }),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.map_outlined),
              label: const Text('Open Tactical Map'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _impactItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w900,
            color: AppColors.primary,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            fontSize: 8,
            fontWeight: FontWeight.bold,
            color: AppColors.secondaryText,
          ),
        ),
      ],
    );
  }
}
