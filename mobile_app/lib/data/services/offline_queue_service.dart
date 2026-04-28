import 'dart:convert';
import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class OfflineQueueService {
  OfflineQueueService._();
  static final OfflineQueueService instance = OfflineQueueService._();
  Database? _db;

  Future<void> init() async {
    if (kIsWeb) return;
    _db ??= await openDatabase(
      p.join(await getDatabasesPath(), 'janrakshak_mobile_queue.db'),
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE queued_mutations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL,
            method TEXT NOT NULL,
            body TEXT,
            created_at TEXT NOT NULL
          )
        ''');
      },
    );
  }

  Future<void> enqueue(
    String method,
    String path,
    Map<String, dynamic>? body,
  ) async {
    if (kIsWeb) return;
    await init();
    await _db!.insert('queued_mutations', {
      'method': method,
      'path': path,
      'body': body == null ? null : jsonEncode(body),
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> pending() async {
    if (kIsWeb) return [];
    await init();
    return _db!.query('queued_mutations', orderBy: 'id ASC');
  }

  Future<void> remove(int id) async {
    if (kIsWeb) return;
    await init();
    await _db!.delete('queued_mutations', where: 'id = ?', whereArgs: [id]);
  }
}
