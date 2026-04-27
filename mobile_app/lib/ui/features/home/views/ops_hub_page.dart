import 'package:flutter/material.dart';
import 'map_view_page.dart';
import 'volunteers_page.dart';
import 'resources_page.dart';

class OpsHubPage extends StatelessWidget {
  const OpsHubPage({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Operations Hub', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: const Icon(Icons.map_outlined),
            title: const Text('Map View'),
            subtitle: const Text('Needs, volunteers, resources layers'),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MapViewPage())),
          ),
        ),
        Card(
          child: ListTile(
            leading: const Icon(Icons.people_outline),
            title: const Text('Volunteers Roster'),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const VolunteersPage())),
          ),
        ),
        Card(
          child: ListTile(
            leading: const Icon(Icons.inventory_2_outlined),
            title: const Text('Resources'),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ResourcesPage())),
          ),
        ),
      ],
    );
  }
}




