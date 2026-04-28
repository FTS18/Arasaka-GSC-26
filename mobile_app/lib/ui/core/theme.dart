import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppConfig {
  static const String backendApi = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: 'http://127.0.0.1:8000/api',
  );
}

class AppColors {
  // Page Background
  static const page = Color(0xFFF6F5F2);
  static const surface = Color(0xFFFFFFFF);
  static const surfaceAlt = Color(0xFFEBE9E4);
  static const darkSurface = Color(0xFF1A1B1C);

  // Text
  static const primaryText = Color(0xFF111213);
  static const secondaryText = Color(0xFF5C5E60);
  static const mutedText = Color(0xFF71717A); // Darker than 8A8D91
  static const inverseText = Color(0xFFF6F5F2);

  // Brand Accents
  static const primary = Color(0xFFE63946);
  static const primaryHover = Color(0xFFC02D3A);
  static const secondary = Color(0xFF2A3D31);
  static const secondaryHover = Color(0xFF1C2921);

  // Status
  static const critical = Color(0xFFDC2626); // High contrast red
  static const warning = Color(0xFFB45309); // Darker amber for readability
  static const success = Color(0xFF065F46); // Darker emerald
  static const info = Color(0xFF1E40AF); // Darker blue
  static const resolved = Color(0xFF059669);

  // Borders
  static const borderDefault = Color(0xFFD1CFCA);
  static const borderFocus = Color(0xFF111213);

  // Legacy (mapping old names to new for compatibility during transition)
  static const bone = page;
  static const ink = primaryText;
  static const danger = critical;
  static const ok = resolved;
}

class AppTheme {
  static ThemeData get light {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        secondary: AppColors.secondary,
        onSecondary: Colors.white,
        surface: AppColors.surface,
        onSurface: AppColors.primaryText,
        error: AppColors.critical,
        brightness: Brightness.light,
      ),
      scaffoldBackgroundColor: AppColors.page,
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.primaryText,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.chivo(
          fontSize: 20,
          fontWeight: FontWeight.w900,
          letterSpacing: -0.5,
          color: AppColors.primaryText,
        ),
        shape: const Border(
          bottom: BorderSide(color: AppColors.borderDefault, width: 1),
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: AppColors.borderDefault, width: 1),
          borderRadius: BorderRadius.circular(2),
        ),
        margin: const EdgeInsets.symmetric(vertical: 6, horizontal: 0),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: const BorderSide(
            color: AppColors.borderDefault,
            width: 1,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: const BorderSide(
            color: AppColors.borderDefault,
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(2),
          borderSide: const BorderSide(color: AppColors.borderFocus, width: 2),
        ),
        labelStyle: GoogleFonts.sora(
          color: AppColors.secondaryText,
          fontWeight: FontWeight.bold,
        ),
        floatingLabelStyle: GoogleFonts.sora(
          color: AppColors.primaryText,
          fontWeight: FontWeight.bold,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(0)),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          textStyle: GoogleFonts.sora(
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
            fontSize: 14,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primaryText,
          side: const BorderSide(color: AppColors.primaryText, width: 1),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(0)),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.page,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final style = GoogleFonts.sora(
            fontSize: 12,
            color: states.contains(WidgetState.selected)
                ? AppColors.primaryText
                : AppColors.secondaryText,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.bold
                : FontWeight.normal,
          );
          return style;
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: AppColors.primary);
          }
          return const IconThemeData(color: AppColors.secondaryText);
        }),
      ),
      useMaterial3: true,
      textTheme: GoogleFonts.soraTextTheme(ThemeData.light().textTheme)
          .copyWith(
            displayLarge: GoogleFonts.chivo(
              fontWeight: FontWeight.w900,
              color: AppColors.primaryText,
              letterSpacing: -1.5,
            ),
            headlineMedium: GoogleFonts.chivo(
              fontWeight: FontWeight.w800,
              color: AppColors.primaryText,
              letterSpacing: -0.5,
            ),
            titleLarge: GoogleFonts.sora(
              fontWeight: FontWeight.bold,
              color: AppColors.primaryText,
              letterSpacing: -0.5,
            ),
            bodyLarge: GoogleFonts.sora(color: AppColors.primaryText),
            bodyMedium: GoogleFonts.sora(color: AppColors.primaryText),
          ),
    );
  }
}
