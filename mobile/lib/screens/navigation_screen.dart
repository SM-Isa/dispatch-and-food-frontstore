import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/services/api_service.dart';

class NavigationScreen extends StatefulWidget {
  final Map<String, dynamic> deliveryData;

  const NavigationScreen({super.key, required this.deliveryData});

  @override
  State<NavigationScreen> createState() => _NavigationScreenState();
}

class _NavigationScreenState extends State<NavigationScreen> {
  // Navigation stage: 'TO_VENDOR' or 'TO_CUSTOMER' or 'COMPLETED'
  String _navStage = 'TO_VENDOR';
  double _routeProgress = 0.20; // 0.0 to 1.0
  int _speedKmh = 32;
  double _distanceRemainingKm = 1.4;
  int _etaMinutes = 5;
  Timer? _simTimer;

  // Turn-by-turn instruction steps
  final List<Map<String, dynamic>> _steps = [
    {
      'instruction': 'Head east on Tanke Akata Road towards University Road',
      'distance': '350m',
      'icon': Icons.straight,
    },
    {
      'instruction': 'Turn right at Tipper Garage Junction onto Fate Road',
      'distance': '800m',
      'icon': Icons.turn_right,
    },
    {
      'instruction': 'Take the 2nd exit at Fate Roundabout towards GRA',
      'distance': '250m',
      'icon': Icons.roundabout_left,
    },
    {
      'instruction': 'Arrive at destination: Plot 14, Fate Road',
      'distance': 'Destination',
      'icon': Icons.location_on,
    },
  ];
  int _currentStepIndex = 0;

  @override
  void initState() {
    super.initState();
    _startSimulatedNavigation();
  }

  @override
  void dispose() {
    _simTimer?.cancel();
    super.dispose();
  }

  void _startSimulatedNavigation() {
    _simTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      if (!mounted) return;
      setState(() {
        if (_routeProgress < 0.95) {
          _routeProgress += 0.04;
          _distanceRemainingKm = math.max(0.1, (1.0 - _routeProgress) * 2.2);
          _etaMinutes = math.max(1, (_distanceRemainingKm * 3.5).round());
          _speedKmh = 25 + (timer.tick % 4) * 5;

          if (_routeProgress > 0.35 && _currentStepIndex == 0) {
            _currentStepIndex = 1;
          } else if (_routeProgress > 0.70 && _currentStepIndex == 1) {
            _currentStepIndex = 2;
          }
        } else {
          _distanceRemainingKm = 0.0;
          _etaMinutes = 0;
          _speedKmh = 0;
          _currentStepIndex = 3;
        }
      });
    });
  }

  Future<void> _advanceDeliveryStage() async {
    final deliveryId = widget.deliveryData['id'] ?? widget.deliveryData['delivery_id'];

    if (_navStage == 'TO_VENDOR') {
      if (deliveryId != null) {
        try {
          await ApiService.patch(ApiConstants.markPickup(deliveryId.toString()), {});
        } catch (_) {}
      }
      setState(() {
        _navStage = 'TO_CUSTOMER';
        _routeProgress = 0.10;
        _currentStepIndex = 0;
        _distanceRemainingKm = 2.4;
        _etaMinutes = 8;
      });
    } else if (_navStage == 'TO_CUSTOMER') {
      if (deliveryId != null) {
        try {
          await ApiService.patch(
            ApiConstants.markDelivered(deliveryId.toString()),
            {'proofImageUrl': 'https://cdn.dispatch.ng/proofs/delivery_gps.jpg'},
          );
        } catch (_) {}
      }
      setState(() {
        _navStage = 'COMPLETED';
        _simTimer?.cancel();
      });
    } else {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    final step = _steps[_currentStepIndex];
    final vendorName = widget.deliveryData['vendor_name'] ?? "Mama's Kitchen";
    final customerAddress =
        widget.deliveryData['delivery_address'] ?? 'Plot 14, Fate Road, Ilorin';

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        foregroundColor: Colors.white,
        title: Text(
          _navStage == 'TO_VENDOR'
              ? 'Pickup Navigation: $vendorName'
              : 'Dropoff Navigation: Customer',
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.phone),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Calling customer/vendor contact...')),
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // 1. Vector Map Canvas
          Positioned.fill(
            child: CustomPaint(
              painter: RouteMapPainter(progress: _routeProgress),
            ),
          ),

          // 2. Turn-By-Turn Top Maneuver Card
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B).withOpacity(0.95),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black45,
                    blurRadius: 10,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(step['icon'] as IconData,
                        color: Colors.white, size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          step['distance'] as String,
                          style: const TextStyle(
                            color: Color(0xFF34D399),
                            fontWeight: FontWeight.w900,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          step['instruction'] as String,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3. Floating Speedometer & Landmark Pill
          Positioned(
            left: 16,
            bottom: 180,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Column(
                children: [
                  Text(
                    '$_speedKmh',
                    style: const TextStyle(
                      color: Color(0xFF34D399),
                      fontWeight: FontWeight.w900,
                      fontSize: 22,
                    ),
                  ),
                  const Text(
                    'KM/H',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 4. Bottom Control Drawer
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Color(0xFF1E293B),
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
                border: Border(
                  top: BorderSide(color: Color(0xFF334155), width: 1.5),
                ),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Distance & ETA Summary Row
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'DISTANCE REMAINING',
                              style: TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '${_distanceRemainingKm.toStringAsFixed(1)} km',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'ESTIMATED ARRIVAL',
                              style: TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '$_etaMinutes mins',
                              style: const TextStyle(
                                color: Color(0xFF34D399),
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Primary Action Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          elevation: 2,
                        ),
                        onPressed: _advanceDeliveryStage,
                        child: Text(
                          _navStage == 'TO_VENDOR'
                              ? 'ARRIVED AT VENDOR (COLLECT FOOD)'
                              : _navStage == 'TO_CUSTOMER'
                                  ? 'DELIVERED TO CUSTOMER (COMPLETE)'
                                  : 'RETURN TO HOME SCREEN',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
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
        ],
      ),
    );
  }
}

/// Custom Vector Map Painter rendering curved roads and motorcycle location
class RouteMapPainter extends CustomPainter {
  final double progress;

  RouteMapPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    // 1. Background Road Network
    final roadPaint = Paint()
      ..color = const Color(0xFF334155)
      ..strokeWidth = 12
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final activeRoutePaint = Paint()
      ..color = const Color(0xFF059669)
      ..strokeWidth = 6
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final startX = size.width * 0.20;
    final startY = size.height * 0.70;
    final endX = size.width * 0.80;
    final endY = size.height * 0.25;

    path.moveTo(startX, startY);
    path.quadraticBezierTo(
      size.width * 0.40,
      size.height * 0.65,
      size.width * 0.50,
      size.height * 0.45,
    );
    path.quadraticBezierTo(
      size.width * 0.60,
      size.height * 0.25,
      endX,
      endY,
    );

    // Draw base road
    canvas.drawPath(path, roadPaint);
    // Draw active path
    canvas.drawPath(path, activeRoutePaint);

    // 2. Start Marker (Vendor Pin)
    final vendorPaint = Paint()..color = const Color(0xFFF59E0B);
    canvas.drawCircle(Offset(startX, startY), 8, vendorPaint);

    // 3. Destination Marker (Customer Pin)
    final customerPaint = Paint()..color = const Color(0xFF10B981);
    canvas.drawCircle(Offset(endX, endY), 10, customerPaint);

    // 4. Motorcycle Current Position
    final riderX = startX + (endX - startX) * progress;
    final riderY = startY +
        (endY - startY) * progress -
        math.sin(progress * math.PI) * 40;

    // Pulse radar ring
    final radarPaint = Paint()
      ..color = const Color(0xFF34D399).withOpacity(0.3)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(riderX, riderY), 22, radarPaint);

    // Bike body
    final bikePaint = Paint()..color = const Color(0xFF059669);
    canvas.drawCircle(Offset(riderX, riderY), 10, bikePaint);

    final innerPaint = Paint()..color = Colors.white;
    canvas.drawCircle(Offset(riderX, riderY), 4, innerPaint);
  }

  @override
  bool shouldRepaint(covariant RouteMapPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
