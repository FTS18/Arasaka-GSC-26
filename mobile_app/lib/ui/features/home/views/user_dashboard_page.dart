import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';
import '../../../core/widgets.dart';
import '../../needs/views/need_detail_page.dart';
import '../../needs/views/new_need_page.dart';
import '../../ai_assistant/views/ai_insight_page.dart';

class UserDashboardPage extends StatefulWidget {
  const UserDashboardPage({super.key});

  @override
  State<UserDashboardPage> createState() => _UserDashboardPageState();
}

class _UserDashboardPageState extends State<UserDashboardPage> {
  bool loading = true;
  List<Map<String, dynamic>> myNeeds = [];
  Map<String, dynamic> stats = {};
  Map<String, dynamic> globalStats = {};

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final auth = context.read<AuthProvider>();
      final allNeeds = asList(
        await auth.api.request('GET', '/needs', query: {'limit': 300}),
      );
      final st = asMap(await auth.api.request('GET', '/dashboard/stats'));
      final gst = asMap(await auth.api.request('GET', '/stats/global'));
      final uid = auth.user?.id;
      myNeeds = allNeeds
          .where((n) => readString(n, 'created_by') == uid)
          .toList();
      stats = st;
      globalStats = gst;
    } catch (_) {
      stats = {};
    }
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    final activeNeeds = myNeeds
        .where((n) => readString(n, 'status') != 'completed')
        .toList();

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
                image: NetworkImage(
                  'https://images.pexels.com/photos/7634479/pexels-photo-7634479.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
                ),
                fit: BoxFit.cover,
                opacity: 0.1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Help is Near.',
                  style: TextStyle(
                    fontSize: 40,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    letterSpacing: -1.0,
                    height: 1.0,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Janrakshak connects you directly with field volunteers and relief resources.',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const NewNeedPage()),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 16,
                    ),
                  ),
                  child: const Text('I Need Help Now'),
                ),
              ],
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
          const SizedBox(height: 32),
          const Text(
            'Global Impact Ticker',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.0,
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
            'Incident Summary',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.0,
              color: AppColors.secondaryText,
            ),
          ),
          const SizedBox(height: 12),
          statWrap([
            statCard(
              'Critical',
              readInt(stats, 'critical_needs').toString(),
              AppColors.critical,
            ),
            statCard(
              'Active',
              readInt(stats, 'active_needs').toString(),
              AppColors.warning,
            ),
            statCard(
              'Resolved',
              readInt(stats, 'resolved_needs').toString(),
              AppColors.success,
            ),
            statCard(
              'Volunteers',
              readInt(stats, 'active_volunteers').toString(),
              AppColors.info,
            ),
          ]),
          const SizedBox(height: 32),
          Row(
            children: [
              const Text(
                'Active Field Requests',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              const Spacer(),
              TextButton(
                onPressed: () {},
                child: const Text(
                  'History →',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (activeNeeds.isEmpty)
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                border: Border.all(
                  color: AppColors.borderDefault,
                  style: BorderStyle.solid,
                ),
                borderRadius: BorderRadius.circular(2),
              ),
              child: const Column(
                children: [
                  Text(
                    'No Active Requests Found',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppColors.mutedText,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Report an issue now to get assistance',
                    style: TextStyle(fontSize: 12, color: AppColors.mutedText),
                  ),
                ],
              ),
            )
          else
            ...activeNeeds.take(5).map((n) {
              final urgency = readInt(n, 'urgency');
              final statusRaw = readString(n, 'status') ?? 'pending';
              final status = statusRaw.toLowerCase() == 'in_progress'
                  ? 'In Progress'
                  : '${statusRaw.toLowerCase()[0].toUpperCase()}${statusRaw.toLowerCase().substring(1)}';

              return CommandCard(
                title: readString(n, 'title') ?? '-',
                accentColor: urgency >= 4 ? AppColors.critical : null,
                status: status,
                subtitle: Text(
                  '${readString(n, 'category') ?? '-'} · Reported ${readString(n, 'created_at')?.split('T').last.substring(0, 5)}',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: AppColors.secondaryText,
                  ),
                ),
                trailing: TacticalBadge(
                  text: 'U$urgency',
                  color: urgency >= 4
                      ? AppColors.critical
                      : AppColors.secondaryText,
                  critical: urgency >= 4,
                ),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) =>
                        NeedDetailPage(needId: readString(n, 'id') ?? ''),
                  ),
                ),
              );
            }),
          const SizedBox(height: 32),
          const Text(
            'Safety Bulletin',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 12),
          _bulletinItem(
            'Storm Alert',
            'Heavy rain expected in East District within 2 hours. Seek shelter.',
            '10:45',
            AppColors.critical,
          ),
          _bulletinItem(
            'Relief Update',
            'Clean water distribution active at Central Hub. Bring containers.',
            '09:12 Z',
            AppColors.info,
          ),
          _bulletinItem(
            'Resource Notice',
            'Medical team arriving at District 4 community center tomorrow morning.',
            '08:00',
            AppColors.primaryText,
          ),
        ],
      ),
    );
  }

  Widget _bulletinItem(String label, String text, String time, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceAlt.withValues(alpha: 0.5),
        border: Border(left: BorderSide(color: color, width: 4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: color,
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            text,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'Updated $time',
            style: const TextStyle(fontSize: 8, color: AppColors.mutedText),
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
