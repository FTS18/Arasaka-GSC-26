import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
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
            NavigationDestination(
              icon: Icon(Icons.analytics_outlined),
              label: 'Dashboard',
            ),
            NavigationDestination(
              icon: Icon(Icons.list_alt_outlined),
              label: 'Needs',
            ),
            NavigationDestination(
              icon: Icon(Icons.assignment_outlined),
              label: 'Missions',
            ),
            NavigationDestination(
              icon: Icon(Icons.hub_outlined),
              label: 'Ops Hub',
            ),
            NavigationDestination(
              icon: Icon(Icons.manage_accounts_outlined),
              label: 'Profile',
            ),
          ]
        : const [
            NavigationDestination(
              icon: Icon(Icons.analytics_outlined),
              label: 'Dashboard',
            ),
            NavigationDestination(
              icon: Icon(Icons.list_alt_outlined),
              label: 'Needs',
            ),
            NavigationDestination(
              icon: Icon(Icons.add_box_outlined),
              label: 'Report',
            ),
            NavigationDestination(
              icon: Icon(Icons.manage_accounts_outlined),
              label: 'Profile',
            ),
          ];

    if (idx >= pages.length) {
      idx = 0;
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Janrakshak Ops',
              style: GoogleFonts.chivo(
                fontSize: 16,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            Text(
              '${role.toLowerCase()[0].toUpperCase()}${role.toLowerCase().substring(1)} Unit',
              style: GoogleFonts.sora(
                fontSize: 10,
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        actions: [
          if (!auth.online)
            const Padding(
              padding: EdgeInsets.only(right: 12),
              child: Tooltip(
                message: 'Offline Mode',
                child: Icon(
                  Icons.cloud_off,
                  color: AppColors.warning,
                  size: 20,
                ),
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
                    auth.liveAssignmentMessage!,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                  trailing: IconButton(
                    icon: const Icon(
                      Icons.close,
                      color: Colors.white,
                      size: 16,
                    ),
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
