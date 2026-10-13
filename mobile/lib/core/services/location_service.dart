import 'dart:async';
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import 'api_service.dart';

class LocationService {
  static Timer? _heartbeatTimer;
  static bool _isOnline = false;

  /// Start battery-efficient background heartbeat pinging
  static void startHeartbeat({required String cluster}) {
    _isOnline = true;
    _heartbeatTimer?.cancel();

    // Ping every 20 seconds: minimal ~80 bytes payload to conserve rider's data
    _heartbeatTimer = Timer.periodic(const Duration(seconds: 20), (timer) async {
      if (!_isOnline) {
        timer.cancel();
        return;
      }

      try {
        // In physical production app, Geolocator.getCurrentPosition() is called here
        // Simulated coordinates for Tanke, Ilorin cluster
        final payload = {
          'latitude': 8.4831 + (timer.tick % 5) * 0.0005,
          'longitude': 4.5823 + (timer.tick % 5) * 0.0005,
          'cluster': cluster,
        };

        final response = await ApiService.post(ApiConstants.heartbeat, payload);
        if (kDebugMode) {
          debugPrint('Heartbeat ping sent: ${response.statusCode}');
        }
      } catch (e) {
        if (kDebugMode) {
          debugPrint('Failed to send rider heartbeat: $e');
        }
      }
    });
  }

  static void stopHeartbeat() {
    _isOnline = false;
    _heartbeatTimer?.cancel();
    _heartbeatTimer = null;
  }
}
