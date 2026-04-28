import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../view_models/auth_provider.dart';
import '../../../core/theme.dart';
import '../../debug/debug_logs_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController(text: 'user@janrakshakops.com');
  final _password = TextEditingController(text: 'User@12345');
  String _selectedRole = 'user'; // 'user' or 'volunteer'
  bool _busy = false;

  void _updateCreds(String role) {
    setState(() {
      _selectedRole = role;
      if (role == 'user') {
        _email.text = 'user@janrakshakops.com';
        _password.text = 'User@12345';
      } else {
        _email.text = 'volunteer@janrakshakops.com';
        _password.text = 'Volunteer@12345';
      }
    });
  }

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      await context.read<AuthProvider>().login(
        _email.text.trim(),
        _password.text,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.critical,
            behavior: SnackBarBehavior.floating,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.zero,
            ),
            content: Text(
              'Auth Failure: $e',
              style: GoogleFonts.sora(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          color: AppColors.darkSurface,
          image: DecorationImage(
            image: NetworkImage(
              'https://images.pexels.com/photos/7002951/pexels-photo-7002951.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
            ),
            fit: BoxFit.cover,
            opacity: 0.2,
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppColors.page.withValues(alpha: 0.95),
                border: Border.all(color: AppColors.borderDefault, width: 2),
                borderRadius: BorderRadius.circular(2),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Est. 2026 · Field Console',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: AppColors.secondaryText,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Sign In',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -1.0,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Operator credentials required.',
                    style: TextStyle(color: AppColors.mutedText, fontSize: 13),
                  ),
                  const SizedBox(height: 32),

                  // Role Toggler
                  Row(
                    children: [
                      _roleButton(
                        'User',
                        _selectedRole == 'user',
                        () => _updateCreds('user'),
                      ),
                      const SizedBox(width: 8),
                      _roleButton(
                        'Volunteer',
                        _selectedRole == 'volunteer',
                        () => _updateCreds('volunteer'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  TextField(
                    controller: _email,
                    decoration: const InputDecoration(
                      labelText: 'Email Address',
                    ),
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _password,
                    decoration: const InputDecoration(
                      labelText: 'Access Password',
                    ),
                    obscureText: true,
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _busy ? null : _submit,
                      child: Text(
                        _busy ? 'Authenticating...' : 'Enter Console',
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  const Divider(color: AppColors.borderDefault),
                  const SizedBox(height: 16),
                  const Text(
                    'Quick Access Test Credentials',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w900,
                      color: AppColors.mutedText,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      _testCredCard(
                        'User',
                        'user@janrakshakops.com',
                        () => _updateCreds('user'),
                      ),
                      const SizedBox(width: 12),
                      _testCredCard(
                        'Volunteer',
                        'volunteer@janrakshakops.com',
                        () => _updateCreds('volunteer'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Center(
                    child: TextButton.icon(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => const DebugLogsScreen(),
                          ),
                        );
                      },
                      icon: const Icon(
                        Icons.bug_report,
                        size: 16,
                        color: AppColors.mutedText,
                      ),
                      label: const Text(
                        'View Debug Logs',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: AppColors.mutedText,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _roleButton(String label, bool active, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: active ? AppColors.primary : Colors.transparent,
            border: Border.all(
              color: active ? AppColors.primary : AppColors.borderDefault,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: active ? Colors.white : AppColors.secondaryText,
                letterSpacing: 1.0,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _testCredCard(String label, String email, VoidCallback onTap) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.borderDefault),
            color: AppColors.surfaceAlt.withValues(alpha: 0.5),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                decoration: BoxDecoration(
                  border: Border.all(color: AppColors.primary),
                  borderRadius: BorderRadius.circular(1),
                ),
                child: Text(
                  label,
                  style: const TextStyle(
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                email,
                style: const TextStyle(
                  fontSize: 9,
                  fontFamily: 'Sora',
                  color: AppColors.secondaryText,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const Text(
                '********',
                style: TextStyle(
                  fontSize: 9,
                  fontFamily: 'Sora',
                  color: AppColors.mutedText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
