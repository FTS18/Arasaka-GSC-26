# Mobile App Debug Guide

## Overview
This guide explains the logging system setup for the Janrakshak mobile app and how to diagnose issues using the debug tools.

## Quick Setup

### 1. Run `flutter pub get` to install the logger package
```bash
cd mobile_app
flutter pub get
```

### 2. Access the Debug Logs Screen
Add this to your HomeScreen or any navigation:
```dart
// In your navigation or menu
Navigator.of(context).push(
  MaterialPageRoute(
    builder: (context) => const DebugLogsScreen(),
  ),
);
```

Or add a debug button in your AppShell:
```dart
FloatingActionButton(
  onPressed: () {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const DebugLogsScreen(),
      ),
    );
  },
  child: const Icon(Icons.bug_report),
),
```

---

## Current Issues

### Issue #1: Network Error - "No route to host"
```
PROVISIONING_ERROR: ClientException with SocketException: 
No route to host (OS Error: No route to host, errno = 113), 
address = 172.31.68.22, port = 49800, 
uri=http://172.31.68.22:8000/api/auth/me
```

**Cause**: The mobile app cannot reach the backend server at `172.31.68.22:8000`.

**Diagnosis Steps**:
1. Open the Debug Logs screen
2. Look for logs starting with `🌐 Network status` and `📤 REQUEST`
3. Check for `❌ NETWORK ERROR` entries

**Solutions**:
1. **Check Backend Server IP**: Verify the `AppConfig.backendApi` in your app matches the actual backend IP
   - Look in `mobile_app/lib/ui/core/theme.dart` or `mobile_app/lib/ui/core/utils.dart`
   - Update it to the correct IP/port where your backend is running

2. **Check Firewall**: Ensure your device can reach `172.31.68.22:8000`
   - Test with: `adb shell ping 172.31.68.22`

3. **Check Backend**: Ensure the backend server is actually running on that IP/port
   - Check: `python backend/server.py` is running
   - Verify port with: `netstat -an | grep 49800`

---

### Issue #2: Onboarding Loop (Even with Test Credentials)
```
AuthGate checks: if (auth.user?.onboarded != true) { return OnboardingScreen(); }
```

**Cause**: Even if test credentials exist in the database, the `onboarded` flag must be `true`.

**Diagnosis Steps**:
1. Open Debug Logs
2. Look for `🔐 AUTH` logs
3. Check if logs show: `"onboarded": false`

**Why This Happens**:
- Test users created in the database must explicitly have `onboarded: true`
- The onboarding process calls `/auth/onboard` endpoint to set this flag
- Without this endpoint call, even existing users must complete onboarding

**Solutions**:

**Option 1: Mark test credentials as onboarded in database**
```python
# In backend/server.py or firestore
user_doc.update({
    'onboarded': True,
    'onboarded_at': datetime.now(timezone.utc),
})
```

**Option 2: Complete the onboarding flow**
1. Fill in the UNIT_DETAILS form
2. Click FINALIZE_DEPLOYMENT
3. The app will call `/auth/onboard` endpoint
4. After success, user will be marked as `onboarded: true`

**Option 3: Skip onboarding for test users**
In `mobile_app/lib/main.dart`, modify AuthGate:
```dart
// For testing only - comment out before production
if (auth.user?.onboarded != true) {
  // return const OnboardingScreen();
  // TEMPORARY: Skip for testing
  // Skip onboarding
}
```

---

## Understanding the Logs

### Log Format
Each log entry shows:
- **Icon/Emoji**: Indicates log type
- **Timestamp**: When the log was created
- **Message**: Detailed information

### Common Log Patterns

#### 🚀 App Startup
```
[timestamp] 🚀 AuthProvider bootstrap started
[timestamp] 📱 Loaded token from storage: present
[timestamp] 🔐 AUTH: Token validation - {"status": "validating"}
```

#### 🔐 Login Success
```
[timestamp] 🔐 AUTH: Login attempt - {"email": "test@example.com"}
[timestamp] 📤 REQUEST: POST /auth/login
[timestamp] 📥 RESPONSE: 200 POST /auth/login (250ms)
[timestamp] 🔐 AUTH: Login success - {"user_id": "123", "onboarded": false}
```

#### ❌ Network Error
```
[timestamp] 📤 REQUEST: GET /auth/me
[timestamp] 🔌 NETWORK ERROR: GET /auth/me - SocketException: No route to host
```

#### ✅ Onboarding Success
```
[timestamp] 🔐 AUTH: Onboarding started
[timestamp] 📤 REQUEST: POST /auth/onboard
[timestamp] 📥 RESPONSE: 200 POST /auth/onboard (300ms)
[timestamp] 🔐 AUTH: Onboarding completed - {"user_id": "123", "onboarded": true}
```

---

## How Logging Works

### LoggerService Features
1. **Network Logging**: Logs all HTTP requests/responses with duration
2. **Auth Logging**: Tracks login, register, onboarding, token validation
3. **Error Logging**: Captures exceptions with stack traces
4. **Sensitive Data Sanitization**: Redacts passwords, tokens, etc.
5. **Memory Buffer**: Keeps last 500 logs for in-app viewing

### Log Levels
- **V** (Verbose): Detailed info for debugging
- **D** (Debug): Debug-level messages
- **I** (Info): General information (✅, 🔐, 📤, etc.)
- **W** (Warning): Warning messages (⚠️)
- **E** (Error): Error messages (❌)
- **WTF**: Critical errors (should never happen)

---

## Accessing Logs Programmatically

```dart
import 'package:janrakshak_mobile/data/services/logger_service.dart';

// Get logger instance (singleton)
final logger = LoggerService();

// Get all logs
final allLogs = logger.getLogs(); // Returns List<String>

// Clear logs
logger.clearLogs();

// Log custom messages
logger.info('Custom info message');
logger.error('Custom error', exception, stackTrace);
logger.logAuthEvent('Custom auth event', {'key': 'value'});
logger.logNetworkRequest('POST', '/api/endpoint', body: {'data': 'value'});
```

---

## Exporting Logs

To export logs for debugging:
```dart
import 'package:share_plus/share_plus.dart';

final logger = LoggerService();
final logsText = logger.getLogs().join('\n');
Share.share(logsText, subject: 'Janrakshak Debug Logs');
```

---

## Testing the Fix

### Test Network Connectivity
1. Update `AppConfig.backendApi` to correct IP/port
2. Open Debug Logs
3. You should see successful requests logged

### Test Onboarding
1. Login with test credentials
2. Check logs for `"onboarded": false`
3. Complete onboarding form
4. After FINALIZE_DEPLOYMENT, check logs for `"onboarded": true`

---

## Next Steps
1. Install the logger package: `flutter pub get`
2. Verify backend IP/port
3. Mark test users as onboarded OR complete the onboarding flow
4. Monitor logs during testing to catch issues early

For more details, see the inline comments in:
- `mobile_app/lib/data/services/logger_service.dart`
- `mobile_app/lib/data/services/api_client.dart`
- `mobile_app/lib/ui/features/auth/view_models/auth_provider.dart`
