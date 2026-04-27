import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';
import 'user_dashboard_page.dart';
import 'volunteer_dashboard_page.dart';
import 'ops_hub_page.dart';
import '../../needs/views/needs_page.dart';
import '../../needs/views/new_need_page.dart';
import '../../missions/views/missions_page.dart';
import '../../profile/views/profile_settings_page.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int idx = 0;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final role = auth.user?.role ?? 'user';

    final pages = role == 'volunteer'
        ? const [
            VolunteerDashboardPage(),
            NeedsPage(),
            MissionsPage(),
            OpsHubPage(),
            ProfileSettingsPage(),
          ]
        : const [
            UserDashboardPage(),
            NeedsPage(),
            NewNeedPage(),
            ProfileSettingsPage(),
          ];

    final nav = role == 'volunteer'
        ? const [
            NavigationDestination(icon: Icon(Icons.analytics_outlined), label: 'DASHBOARD'),
            NavigationDestination(icon: Icon(Icons.list_alt_outlined), label: 'NEEDS'),
            NavigationDestination(icon: Icon(Icons.assignment_outlined), label: 'MISSIONS'),
            NavigationDestination(icon: Icon(Icons.hub_outlined), label: 'OPS'),
            NavigationDestination(icon: Icon(Icons.manage_accounts_outlined), label: 'PROFILE'),
          ]
        : const [
            NavigationDestination(icon: Icon(Icons.analytics_outlined), label: 'DASHBOARD'),
            NavigationDestination(icon: Icon(Icons.list_alt_outlined), label: 'NEEDS'),
            NavigationDestination(icon: Icon(Icons.add_box_outlined), label: 'REPORT'),
            NavigationDestination(icon: Icon(Icons.manage_accounts_outlined), label: 'PROFILE'),
          ];

    if (idx >= pages.length) {
      idx = 0;
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('JANRAKSHAK_OPS'.toUpperCase(), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.0)),
            Text('${role.toUpperCase()}_UNIT'.toUpperCase(), style: const TextStyle(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
          ],
        ),
        actions: [
          if (!auth.online)
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: Tooltip(
                message: 'OFFLINE_MODE',
                child: Icon(Icons.cloud_off, color: AppColors.warning, size: 20),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.sync, size: 20),
            onPressed: () => auth.syncQueuedMutations(),
          ),
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            onPressed: () => auth.logout(),
          ),
        ],
      ),
      body: Stack(
        children: [
          IndexedStack(index: idx, children: pages),
          if (auth.liveAssignmentMessage != null)
            Positioned(
              left: 12,
              right: 12,
              top: 12,
              child: Material(
                color: AppColors.critical,
                child: ListTile(
                  dense: true,
                  leading: const Icon(Icons.priority_high, color: Colors.white),
                  title: Text(
                    auth.liveAssignmentMessage!.toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12, fontFamily: 'monospace'),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white, size: 16),
                    onPressed: auth.clearLiveAssignmentNotice,
                  ),
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
        destinations: nav,
        onDestinationSelected: (value) => setState(() => idx = value),
      ),
    );
  }
}
