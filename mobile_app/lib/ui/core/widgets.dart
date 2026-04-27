import 'package:flutter/material.dart';
import 'theme.dart';

class SparklinePainter extends CustomPainter {
  final Color color;
  SparklinePainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(0.2)
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
    
    canvas.drawPath(fillPath, Paint()..color = color.withOpacity(0.05)..style = PaintingStyle.fill);
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
            border: Border(
              top: BorderSide(color: color, width: 2),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    label.toUpperCase(),
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.5,
                      color: AppColors.secondaryText,
                    ),
                  ),
                  Icon(Icons.analytics_outlined, size: 12, color: color.withOpacity(0.5)),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'monospace',
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
  const TacticalBadge({super.key, required this.text, required this.color, this.critical = false});

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
        text.toUpperCase(),
        style: TextStyle(
          color: critical ? Colors.white : color,
          fontSize: 9,
          fontWeight: FontWeight.w900,
          fontFamily: 'monospace',
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
            ? BoxDecoration(border: Border(left: BorderSide(color: accentColor!, width: 4))) 
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
                  if (trailing != null) trailing!,
                ],
              ),
              if (status != null) ...[
                const SizedBox(height: 12),
                StepProgress(status: status!),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _statusLabel('INTAKE', status == 'pending'),
                    _statusLabel('ASSIGNED', status == 'assigned'),
                    _statusLabel('TRANSIT', status == 'in_progress'),
                    _statusLabel('RESOLVED', status == 'completed'),
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
