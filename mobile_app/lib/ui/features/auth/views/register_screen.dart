import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../view_models/auth_provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  String _role = 'volunteer';
  String _language = 'en';
  bool _busy = false;

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      await context.read<AuthProvider>().register({
        'name': _name.text.trim(),
        'email': _email.text.trim(),
        'password': _password.text,
        'role': _role,
        'language': _language,
      });
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Registration failed: $e')),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create account')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(controller: _name, decoration: const InputDecoration(labelText: 'Full name')),
          const SizedBox(height: 12),
          TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email')),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _role,
            items: const [
              DropdownMenuItem(value: 'user', child: Text('User')),
              DropdownMenuItem(value: 'volunteer', child: Text('Volunteer')),
            ],
            onChanged: (v) => setState(() => _role = v ?? 'volunteer'),
            decoration: const InputDecoration(labelText: 'Role'),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _language,
            items: const [
              DropdownMenuItem(value: 'en', child: Text('English')),
              DropdownMenuItem(value: 'hi', child: Text('Hindi')),
            ],
            onChanged: (v) => setState(() => _language = v ?? 'en'),
            decoration: const InputDecoration(labelText: 'Language'),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _busy ? null : _submit,
            child: Text(_busy ? 'Creating...' : 'Create account'),
          ),
        ],
      ),
    );
  }
}




