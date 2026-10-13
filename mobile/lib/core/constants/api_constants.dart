import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConstants {
  /// Automatically resolves the correct backend host depending on the runtime platform:
  /// - Android Emulator: 10.0.2.2 (special loopback to host localhost)
  /// - iOS Simulator / macOS / Web: localhost
  /// - Physical devices: configure with your host machine LAN IP (e.g. 192.168.1.x)
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:4000/api';
    }
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:4000/api';
      }
    } catch (_) {
      // Fallback if dart:io is unavailable
    }
    return 'http://localhost:4000/api';
  }

  // Auth endpoints
  static String get requestOtp => '$baseUrl/auth/otp/request';
  static String get verifyOtp => '$baseUrl/auth/otp/verify';

  // Rider endpoints
  static String get riderProfile => '$baseUrl/riders/profile/me';
  static String get heartbeat => '$baseUrl/riders/heartbeat';
  static String get toggleOnline => '$baseUrl/riders/online';
  static String get myOffers => '$baseUrl/dispatch/my-offers';
  static String get respondOffer => '$baseUrl/dispatch/respond';
  static String get activeDelivery => '$baseUrl/deliveries/active/me';
  static String markPickup(String deliveryId) => '$baseUrl/deliveries/$deliveryId/pickup';
  static String markDelivered(String deliveryId) => '$baseUrl/deliveries/$deliveryId/delivered';

  // Wallet & Payout endpoints
  static String get riderWallet => '$baseUrl/ledger/wallet/rider';
  static String get requestPayout => '$baseUrl/payouts/request';

  // Customer & Vendor endpoints (for mobile customer and vendor flows)
  static String get vendors => '$baseUrl/vendors?isOpenOnly=false';
  static String vendorProducts(String vendorId) => '$baseUrl/vendors/$vendorId/products';
  static String get createOrder => '$baseUrl/orders';
  static String initiatePayment(String orderId) => '$baseUrl/payments/initiate/$orderId';
  static String vendorOrders(String vendorId) => '$baseUrl/orders/vendor/$vendorId';
  static String updateOrderStatus(String orderId) => '$baseUrl/orders/$orderId/status';
}
