import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme.dart';
import 'package:record/record.dart';
import 'package:path_provider/path_provider.dart';

class SparklinePainter extends CustomPainter {
  final Color color;
  SparklinePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withValues(alpha: 0.2)
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    final path = Path();
    path.moveTo(0, size.height * 0.7);
    path.lineTo(size.width * 0.2, size.height * 0.5);
    path.lineTo(size.width * 0.4, size.height * 0.8);
    path.lineTo(size.width * 0.6, size.height * 0.3);
    path.lineTo(size.width * 0.8, size.height * 0.6);
    path.lineTo(size.width, size.height * 0.4);

    canvas.drawPath(path, paint);

    // Also draw a subtle fill
    final fillPath = Path.from(path)
      ..lineTo(size.width, size.height)
      ..lineTo(0, size.height)
      ..close();

    canvas.drawPath(
      fillPath,
      Paint()
        ..color = color.withValues(alpha: 0.05)
        ..style = PaintingStyle.fill,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

Widget statCard(String label, String value, Color color) {
  return Card(
    clipBehavior: Clip.antiAlias,
    child: Stack(
      children: [
        Positioned(
          bottom: -10,
          left: -10,
          right: -10,
          height: 60,
          child: CustomPaint(painter: SparklinePainter(color: color)),
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border(top: BorderSide(color: color, width: 2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    label,
                    style: GoogleFonts.sora(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.0,
                      color: AppColors.secondaryText,
                    ),
                  ),
                  Icon(
                    Icons.analytics_outlined,
                    size: 12,
                    color: color.withValues(alpha: 0.5),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: GoogleFonts.sora(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1.0,
                  color: AppColors.primaryText,
                ),
              ),
            ],
          ),
        ),
      ],
    ),
  );
}

Widget statWrap(List<Widget> children) {
  return GridView.count(
    crossAxisCount: 2,
    shrinkWrap: true,
    physics: const NeverScrollableScrollPhysics(),
    mainAxisSpacing: 12,
    crossAxisSpacing: 12,
    childAspectRatio: 1.4,
    children: children,
  );
}

class TacticalBadge extends StatelessWidget {
  final String text;
  final Color color;
  final bool critical;
  const TacticalBadge({
    super.key,
    required this.text,
    required this.color,
    this.critical = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: critical ? color : Colors.transparent,
        border: Border.all(color: color, width: 1),
        borderRadius: BorderRadius.circular(2),
      ),
      child: Text(
        text,
        style: GoogleFonts.sora(
          color: critical ? Colors.white : color,
          fontSize: 9,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class StepProgress extends StatelessWidget {
  final String status;
  const StepProgress({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final steps = ["pending", "assigned", "in_progress", "completed"];
    final currentIdx = steps.indexOf(status.toLowerCase());

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: List.generate(steps.length, (idx) {
          final isActive = idx <= currentIdx;
          final isCompleted = status.toLowerCase() == 'completed' && idx == 3;
          final color = isActive
              ? (isCompleted ? AppColors.success : AppColors.primary)
              : AppColors.borderDefault;

          return Expanded(
            child: Container(
              height: 4,
              margin: EdgeInsets.only(right: idx < steps.length - 1 ? 4 : 0),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class CommandCard extends StatelessWidget {
  final String title;
  final Widget? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final Color? accentColor;
  final String? status;

  const CommandCard({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.accentColor,
    this.status,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        child: Container(
          decoration: accentColor != null
              ? BoxDecoration(
                  border: Border(
                    left: BorderSide(color: accentColor!, width: 4),
                  ),
                )
              : null,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -0.5,
                            height: 1.1,
                          ),
                        ),
                        if (subtitle != null) ...[
                          const SizedBox(height: 6),
                          subtitle!,
                        ],
                      ],
                    ),
                  ),
                  trailing ?? const SizedBox.shrink(),
                ],
              ),
              if (status != null) ...[
                const SizedBox(height: 12),
                StepProgress(status: status!),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _statusLabel('Intake', status == 'pending'),
                    _statusLabel('Assigned', status == 'assigned'),
                    _statusLabel('Transit', status == 'in_progress'),
                    _statusLabel('Resolved', status == 'completed'),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _statusLabel(String label, bool active) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 8,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.5,
        color: active ? AppColors.primary : AppColors.mutedText,
      ),
    );
  }
}

class PushToTalkButton extends StatefulWidget {
  final Function(String path) onFinished;
  const PushToTalkButton({super.key, required this.onFinished});

  @override
  State<PushToTalkButton> createState() => _PushToTalkButtonState();
}

class _PushToTalkButtonState extends State<PushToTalkButton> {
  final _audioRecorder = AudioRecorder();
  bool _isRecording = false;

  @override
  void dispose() {
    _audioRecorder.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        final dir = await getTemporaryDirectory();
        final path = '${dir.path}/ptt_${DateTime.now().millisecondsSinceEpoch}.m4a';
        await _audioRecorder.start(const RecordConfig(), path: path);
        setState(() => _isRecording = true);
      }
    } catch (e) {
      debugPrint('PTT Start Error: $e');
    }
  }

  Future<void> _stop() async {
    final path = await _audioRecorder.stop();
    setState(() => _isRecording = false);
    if (path != null) {
      widget.onFinished(path);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPressStart: (_) => _start(),
      onLongPressEnd: (_) => _stop(),
      child: Container(
        width: 80,
        height: 80,
        decoration: BoxDecoration(
          color: _isRecording ? AppColors.critical : AppColors.primary,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: (_isRecording ? AppColors.critical : AppColors.primary)
                  .withValues(alpha: 0.3),
              blurRadius: 20,
              spreadRadius: _isRecording ? 10 : 2,
            )
          ],
        ),
        child: Icon(
          _isRecording ? Icons.mic : Icons.record_voice_over,
          color: Colors.white,
          size: 32,
        ),
      ),
    );
  }
}
