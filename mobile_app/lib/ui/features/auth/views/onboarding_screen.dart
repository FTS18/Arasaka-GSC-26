import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../view_models/auth_provider.dart';
import '../../../core/theme.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  int _step = 1;
  String _role = 'user';
  final _phone = TextEditingController();
  final _city = TextEditingController();
  final _skills = TextEditingController();
  String _transport = 'none';
  bool _busy = false;

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      await context.read<AuthProvider>().onboard({
        'role': _role,
        'phone': _phone.text.trim(),
        'city': _city.text.trim(),
        'skills': _skills.text
            .split(',')
            .map((s) => s.trim())
            .where((s) => s.isNotEmpty)
            .toList(),
        'transport': _transport,
        'home_location': {'lat': 19.076, 'lng': 72.877},
        'emergency_contact': '',
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.critical,
          content: Text('PROVISIONING_ERROR: $e', style: const TextStyle(fontFamily: 'monospace')),
        ),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkSurface,
      body: Container(
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: NetworkImage('https://images.pexels.com/photos/7002951/pexels-photo-7002951.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940'),
            fit: BoxFit.cover,
            opacity: 0.1,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppColors.page.withOpacity(0.95),
                border: Border.all(color: AppColors.borderDefault, width: 2),
                borderRadius: BorderRadius.circular(2),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('UNIT_PROVISIONING_PROTOCOL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.secondaryText, letterSpacing: 1.5)),
                  const SizedBox(height: 8),
                  Text(
                    _step == 1 ? 'SELECT_ROLE' : 'UNIT_DETAILS',
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, letterSpacing: -1.0),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _step == 1 ? 'Define your operational status within the sector.' : 'Finalize your tactical profile for field deployment.',
                    style: const TextStyle(color: AppColors.mutedText, fontSize: 13),
                  ),
                  const SizedBox(height: 32),
                  
                  if (_step == 1) _buildStep1() else _buildStep2(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStep1() {
    return Column(
      children: [
        _roleCard(
          'RESIDENT_OPERATOR',
          'Standard access. Report incidents and request resources.',
          Icons.person_pin_circle_outlined,
          _role == 'user',
          () => setState(() => _role = 'user'),
        ),
        const SizedBox(height: 12),
        _roleCard(
          'FIELD_VOLUNTEER',
          'Active deployment. Accept missions and distribute aid.',
          Icons.medical_services_outlined,
          _role == 'volunteer',
          () => setState(() => _role = 'volunteer'),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () => setState(() => _step = 2),
            child: const Text('CONFIRM_ROLE'),
          ),
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      children: [
        TextField(
          controller: _phone,
          decoration: const InputDecoration(labelText: 'COMMS_FREQUENCY (PHONE)'),
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _city,
          decoration: const InputDecoration(labelText: 'CURRENT_SECTOR (CITY)'),
        ),
        const SizedBox(height: 16),
        if (_role == 'volunteer') ...[
          TextField(
            controller: _skills,
            decoration: const InputDecoration(labelText: 'UNIT_SKILLS (E.G. MEDICAL, LOGISTICS)'),
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            value: _transport,
            items: const [
              DropdownMenuItem(value: 'none', child: Text('ON_FOOT')),
              DropdownMenuItem(value: 'bike', child: Text('BIKE_UNIT')),
              DropdownMenuItem(value: 'car', child: Text('MOBILE_CAR')),
              DropdownMenuItem(value: 'truck', child: Text('HEAVY_CARGO')),
            ],
            onChanged: (v) => setState(() => _transport = v ?? 'none'),
            decoration: const InputDecoration(labelText: 'TRANSPORT_ASSETS'),
          ),
          const SizedBox(height: 16),
        ],
        const SizedBox(height: 24),
        Row(
          children: [
            TextButton(
              onPressed: () => setState(() => _step = 1),
              child: const Text('BACK'),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: _busy ? null : _submit,
              child: Text(_busy ? 'PROVISIONING...' : 'FINALIZE_DEPLOYMENT'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _roleCard(String title, String desc, IconData icon, bool active, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: active ? AppColors.primary.withOpacity(0.05) : Colors.transparent,
          border: Border.all(color: active ? AppColors.primary : AppColors.borderDefault, width: active ? 2 : 1),
          borderRadius: BorderRadius.circular(2),
        ),
        child: Row(
          children: [
            Icon(icon, color: active ? AppColors.primary : AppColors.secondaryText, size: 32),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: active ? AppColors.primary : AppColors.primaryText)),
                  const SizedBox(height: 4),
                  Text(desc, style: const TextStyle(fontSize: 11, color: AppColors.mutedText)),
                ],
              ),
            ),
            if (active) const Icon(Icons.check_circle, color: AppColors.primary, size: 20),
          ],
        ),
      ),
    );
  }
}
