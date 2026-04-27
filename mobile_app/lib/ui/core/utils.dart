import 'package:intl/intl.dart';

Map<String, dynamic> asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, val) => MapEntry('$key', val));
  }
  return <String, dynamic>{};
}

List<Map<String, dynamic>> asList(dynamic value) {
  if (value is List) {
    return value.map((e) => asMap(e)).toList();
  }
  return <Map<String, dynamic>>[];
}

List<String> asListOfString(dynamic value) {
  if (value is List) return value.map((e) => '$e').toList();
  return <String>[];
}

String? readString(Map<String, dynamic>? map, String key) {
  if (map == null) return null;
  final value = map[key];
  if (value == null) return null;
  return '$value';
}

int readInt(Map<String, dynamic>? map, String key) {
  if (map == null) return 0;
  final v = map[key];
  if (v is int) return v;
  if (v is num) return v.toInt();
  return int.tryParse('$v') ?? 0;
}

num readNum(Map<String, dynamic>? map, String key) {
  if (map == null) return 0;
  final v = map[key];
  if (v is num) return v;
  return num.tryParse('$v') ?? 0;
}

String formatTs(String? iso) {
  if (iso == null || iso.isEmpty) return '-';
  try {
    return DateFormat('dd MMM yyyy, HH:mm').format(DateTime.parse(iso));
  } catch (_) {
    return iso;
  }
}

