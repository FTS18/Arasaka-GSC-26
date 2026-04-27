import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'ui/features/auth/view_models/auth_provider.dart';
import 'ui/features/auth/views/login_screen.dart';
import 'ui/features/auth/views/onboarding_screen.dart';
import 'ui/features/home/views/home_screen.dart';
import 'ui/core/theme.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider()..bootstrap(),
      child: const JanrakshakApp(),
    ),
  );
}

class JanrakshakApp extends StatelessWidget {
  const JanrakshakApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Janrakshak Mobile',
      theme: AppTheme.light,
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, child) {
        if (auth.loading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (auth.user == null) {
          return const LoginScreen();
        }
        if (auth.user?.onboarded != true) {
          return const OnboardingScreen();
        }
        return const HomeScreen();
      },
    );
  }
}

