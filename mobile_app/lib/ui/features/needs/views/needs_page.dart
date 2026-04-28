import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../auth/view_models/auth_provider.dart';
import '../../../core/utils.dart';
import '../../../core/theme.dart';
import '../../../core/widgets.dart';
import 'need_detail_page.dart';

class NeedsPage extends StatefulWidget {
  const NeedsPage({super.key});

  @override
  State<NeedsPage> createState() => _NeedsPageState();
}

class _NeedsPageState extends State<NeedsPage> {
  bool loading = true;
  List<Map<String, dynamic>> needs = [];
  String search = '';

  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final auth = context.read<AuthProvider>();
      final res = asList(
        await auth.api.request('GET', '/needs', query: {'limit': 300}),
      );
      needs = res;
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final filtered = needs.where((n) {
      final s = search.toLowerCase();
      return (readString(n, 'title') ?? '').toLowerCase().contains(s) ||
          (readString(n, 'category') ?? '').toLowerCase().contains(s);
    }).toList();

    return Scaffold(
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(
                bottom: BorderSide(color: AppColors.borderDefault, width: 1),
              ),
            ),
            child: TextField(
              onChanged: (v) => setState(() => search = v),
              decoration: InputDecoration(
                hintText: 'Search registry...',
                hintStyle: const TextStyle(
                  fontSize: 12,
                  color: AppColors.mutedText,
                  fontWeight: FontWeight.bold,
                ),
                prefixIcon: const Icon(Icons.search, size: 20),
                contentPadding: const EdgeInsets.symmetric(
                  vertical: 0,
                  horizontal: 12,
                ),
                fillColor: AppColors.page,
                filled: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(2),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: load,
              child: loading
                  ? const Center(child: CircularProgressIndicator())
                  : filtered.isEmpty
                  ? const Center(
                      child: Text(
                        'No records match your query',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.mutedText,
                        ),
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: filtered.length,
                      itemBuilder: (context, i) {
                        final n = filtered[i];
                        final status = readString(n, 'status') ?? 'Unknown';
                        final urgency = readInt(n, 'urgency');

                        Color statusColor = AppColors.secondaryText;
                        if (status.toLowerCase() == 'pending') {
                          statusColor = AppColors.warning;
                        }
                        if (status.toLowerCase() == 'assigned') {
                          statusColor = AppColors.info;
                        }
                        if (status.toLowerCase() == 'in_progress') {
                          statusColor = AppColors.primary;
                        }
                        if (status.toLowerCase() == 'completed') {
                          statusColor = AppColors.success;
                        }

                        return CommandCard(
                          title: readString(n, 'title') ?? '-',
                          accentColor: urgency >= 4 ? AppColors.critical : null,
                          subtitle: Row(
                            children: [
                              Text(
                                readString(n, 'category') ?? '-',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.secondaryText,
                                ),
                              ),
                              const SizedBox(width: 8),
                              TacticalBadge(
                                text:
                                    status[0].toUpperCase() +
                                    status.substring(1).toLowerCase(),
                                color: statusColor,
                              ),
                            ],
                          ),
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text(
                                'Urgency',
                                style: TextStyle(
                                  fontSize: 8,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.mutedText,
                                ),
                              ),
                              Text(
                                'U$urgency',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                            ],
                          ),
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => NeedDetailPage(
                                needId: readString(n, 'id') ?? '',
                              ),
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
