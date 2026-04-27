import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';
import '../../../core/widgets.dart';
import '../../needs/views/need_detail_page.dart';
import '../../needs/views/new_need_page.dart';

class UserDashboardPage extends StatefulWidget {
  const UserDashboardPage({super.key});

  @override
  State<UserDashboardPage> createState() => _UserDashboardPageState();
}

class _UserDashboardPageState extends State<UserDashboardPage> {
  bool loading = true;
  List<Map<String, dynamic>> myNeeds = [];
  Map<String, dynamic> stats = {};

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final auth = context.read<AuthProvider>();
      final allNeeds = asList(await auth.api.request('GET', '/needs', query: {'limit': 300}));
      final st = asMap(await auth.api.request('GET', '/dashboard/stats'));
      final uid = auth.user?.id;
      myNeeds = allNeeds.where((n) => readString(n, 'created_by') == uid).toList();
      stats = st;
    } catch (_) {
      stats = {};
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    final activeNeeds = myNeeds.where((n) => readString(n, 'status') != 'completed').toList();

    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Hero Section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.darkSurface,
              borderRadius: BorderRadius.circular(4),
              image: const DecorationImage(
                image: NetworkImage('https://images.pexels.com/photos/7634479/pexels-photo-7634479.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'),
                fit: BoxFit.cover,
                opacity: 0.1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'HELP_IS_NEAR.',
                  style: TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -2.0,
                    height: 1.0,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'JANRAKSHAK connects you directly with field volunteers and relief resources.',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NewNeedPage())),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  ),
                  child: const Text('+ I_NEED_HELP_NOW'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'INCIDENT_SUMMARY',
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2.0, color: AppColors.secondaryText),
          ),
          const SizedBox(height: 12),
          statWrap([
            statCard('Critical', readInt(stats, 'critical_needs').toString(), AppColors.critical),
            statCard('Active', readInt(stats, 'active_needs').toString(), AppColors.warning),
            statCard('Resolved', readInt(stats, 'resolved_needs').toString(), AppColors.success),
            statCard('Volunteers', readInt(stats, 'active_volunteers').toString(), AppColors.info),
          ]),
          const SizedBox(height: 32),
          Row(
            children: [
              const Text('ACTIVE_FIELD_REQUESTS', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
              const Spacer(),
              TextButton(onPressed: () {}, child: const Text('HISTORY →', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 12),
          if (activeNeeds.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.borderDefault, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(2),
              ),
              child: const Column(
                children: [
                  Text('NO_ACTIVE_REQUESTS_FOUND', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.mutedText)),
                  SizedBox(height: 8),
                  Text('Report an issue now to get assistance', style: TextStyle(fontSize: 12, color: AppColors.mutedText)),
                ],
              ),
            )
          else
            ...activeNeeds.take(5).map((n) {
              final urgency = readInt(n, 'urgency');
              final status = readString(n, 'status') ?? 'PENDING';

              return CommandCard(
                title: (readString(n, 'title') ?? '-').toUpperCase(),
                accentColor: urgency >= 4 ? AppColors.critical : null,
                status: status,
                subtitle: Text(
                  '${(readString(n, 'category') ?? '-').toUpperCase()} · REPORTED ${readString(n, 'created_at')?.split('T').last.substring(0, 5)}',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.secondaryText),
                ),
                trailing: TacticalBadge(text: 'U$urgency', color: urgency >= 4 ? AppColors.critical : AppColors.secondaryText, critical: urgency >= 4),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => NeedDetailPage(needId: readString(n, 'id') ?? '')),
                ),
              );
            }),
          const SizedBox(height: 32),
          const Text('SAFETY_BULLETIN', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
          const SizedBox(height: 12),
          _bulletinItem('STORM_ALERT', 'Heavy rain expected in East District within 2 hours. Seek shelter.', '10:45', AppColors.critical),
          _bulletinItem('RELIEF_UPDATE', 'Clean water distribution active at Central Hub. Bring containers.', '09:12 Z', AppColors.info),
          _bulletinItem('RESOURCE_NOTICE', 'Medical team arriving at District 4 community center tomorrow morning.', '08:00', AppColors.primaryText),
        ],
      ),
    );
  }

  Widget _bulletinItem(String label, String text, String time, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt.withOpacity(0.5),
        border: Border(left: BorderSide(color: color, width: 4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: color, letterSpacing: 1.0)),
          const SizedBox(height: 4),
          Text(text, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('UPDATED $time', style: const TextStyle(fontSize: 8, color: AppColors.mutedText, fontFamily: 'monospace')),
        ],
      ),
    );
  }
}
