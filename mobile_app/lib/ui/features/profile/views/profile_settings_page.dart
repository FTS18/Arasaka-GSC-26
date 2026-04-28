import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/theme.dart';

class ProfileSettingsPage extends StatefulWidget {
  const ProfileSettingsPage({super.key});

  @override
  State<ProfileSettingsPage> createState() => _ProfileSettingsPageState();
}

class _ProfileSettingsPageState extends State<ProfileSettingsPage> {
  final name = TextEditingController();
  final phone = TextEditingController();
  String language = 'en';
  bool loading = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      name.text = user.name;
      phone.text = user.phone ?? '';
      language = user.language;
    }
  }

  Future<void> save() async {
    setState(() => loading = true);
    try {
      final auth = context.read<AuthProvider>();
      await auth.api.request(
        'PUT',
        '/auth/me/profile',
        body: {'name': name.text, 'phone': phone.text, 'language': language},
      );
      await auth.refreshMe();

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Update Failed: $e')));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = context.watch<AuthProvider>().user?.role ?? 'user';
    if (loading) return const Center(child: CircularProgressIndicator());

    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(
            'Operator Profile Settings',
            style: GoogleFonts.sora(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.0,
              color: AppColors.secondaryText,
            ),
          ),
          const SizedBox(height: 24),
          TextField(
            controller: name,
            decoration: const InputDecoration(labelText: 'Full Name'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: phone,
            decoration: const InputDecoration(labelText: 'Contact Phone'),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: language,
            decoration: const InputDecoration(labelText: 'System Language'),
            items: const [
              DropdownMenuItem(value: 'en', child: Text('English (US)')),
              DropdownMenuItem(value: 'hi', child: Text('Hindi (IN)')),
              DropdownMenuItem(value: 'mr', child: Text('Marathi (IN)')),
            ],
            onChanged: (v) => setState(() => language = v!),
          ),
          const SizedBox(height: 32),
          const Divider(height: 1, color: AppColors.borderDefault),
          const SizedBox(height: 16),
          Text(
            'Unit Information',
            style: GoogleFonts.sora(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.5,
              color: AppColors.mutedText,
            ),
          ),
          const SizedBox(height: 8),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text(
              'Role Assignment',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              '${role.toLowerCase()[0].toUpperCase()}${role.toLowerCase().substring(1)} Unit',
              style: GoogleFonts.sora(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(onPressed: save, child: const Text('Save Changes')),
          const SizedBox(height: 16),
          OutlinedButton(
            onPressed: () => context.read<AuthProvider>().logout(),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.critical,
              side: const BorderSide(color: AppColors.critical),
            ),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }
}
