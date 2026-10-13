import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/services/api_service.dart';
import '../core/services/location_service.dart';
import 'wallet_screen.dart';
import 'navigation_screen.dart';
import 'rider_profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isOnline = false;
  bool _loading = false;
  Map<String, dynamic>? _activeDelivery;
  Map<String, dynamic>? _incomingOffer;
  String _cluster = 'TANKE';

  @override
  void initState() {
    super.initState();
    _fetchStatus();
  }

  Future<void> _fetchStatus() async {
    try {
      final res = await ApiService.get(ApiConstants.activeDelivery);
      if (res.statusCode == 200 && res.body.isNotEmpty) {
        setState(() {
          _activeDelivery = jsonDecode(res.body);
        });
      }

      // Check incoming offers
      final offerRes = await ApiService.get(ApiConstants.myOffers);
      if (offerRes.statusCode == 200) {
        final list = jsonDecode(offerRes.body) as List;
        if (list.isNotEmpty) {
          setState(() => _incomingOffer = list[0]);
        }
      }
    } catch (_) {}
  }

  Future<void> _toggleOnline(bool value) async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.patch(ApiConstants.toggleOnline, {'isOnline': value});
      if (res.statusCode == 200) {
        setState(() => _isOnline = value);
        if (value) {
          LocationService.startHeartbeat(cluster: _cluster);
        } else {
          LocationService.stopHeartbeat();
        }
      }
    } catch (_) {} finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _respondOffer(String deliveryId, String response) async {
    try {
      await ApiService.post(ApiConstants.respondOffer, {
        'deliveryId': deliveryId,
        'response': response,
      });
      setState(() => _incomingOffer = null);
      _fetchStatus();
    } catch (_) {}
  }

  Future<void> _markPickedUp(String deliveryId) async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.patch(ApiConstants.markPickup(deliveryId), {});
      if (res.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order marked as Picked Up! Head to customer.')),
        );
        _fetchStatus();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating pickup: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markDelivered(String deliveryId) async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.patch(
        ApiConstants.markDelivered(deliveryId),
        {'proofImageUrl': 'https://cdn.dispatch.ng/proofs/delivery_live.jpg'},
      );
      if (res.statusCode == 200 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Delivery completed! Earnings added to your wallet.')),
        );
        _fetchStatus();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error completing delivery: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rider Dashboard', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            tooltip: 'Wallet & Payouts',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const WalletScreen()),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            tooltip: 'Rider Profile & Incidents',
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const RiderProfileScreen()),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchStatus,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Status & Cluster Card
            Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _isOnline ? 'Online (Ready for Orders)' : 'Offline (Not Dispatched)',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                            color: _isOnline ? const Color(0xFF059669) : const Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text('Cluster Zone: $_cluster', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                      ],
                    ),
                    Switch(
                      value: _isOnline,
                      onChanged: _loading ? null : _toggleOnline,
                      activeColor: const Color(0xFF059669),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Incoming Dispatch Offer Alert
            if (_incomingOffer != null) ...[
              Card(
                color: const Color(0xFFECFDF5),
                shape: RoundedRectangleBorder(
                  side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.between,
                        children: [
                          const Text('⚡ INCOMING DISPATCH OFFER', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF047857), fontSize: 13)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, py: 2),
                            decoration: BoxDecoration(color: const Color(0xFF10B981), borderRadius: BorderRadius.circular(12)),
                            child: const Text('Round 1', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Order #${_incomingOffer!['order_number']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('Pickup: ${_incomingOffer!['pickup_address']}', style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                      Text('Dropoff: ${_incomingOffer!['dropoff_address']}', style: const TextStyle(fontSize: 12, color: Color(0xFF475569))),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => _respondOffer(_incomingOffer!['delivery_id'], 'REJECTED'),
                              child: const Text('Decline'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => _respondOffer(_incomingOffer!['delivery_id'], 'ACCEPTED'),
                              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white),
                              child: const Text('Accept Delivery'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Active Delivery Card
            if (_activeDelivery != null) ...[
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('ACTIVE DELIVERY TASK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF64748B))),
                      const SizedBox(height: 6),
                      Text('Order #${_activeDelivery!['order_number']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('Vendor: ${_activeDelivery!['vendor_name']}', style: const TextStyle(fontSize: 13, color: Color(0xFF334155))),
                      Text('Customer: ${_activeDelivery!['customer_name']} (${_activeDelivery!['customer_phone']})', style: const TextStyle(fontSize: 13, color: Color(0xFF334155))),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.navigation, size: 18),
                        label: const Text('Open Turn-by-Turn GPS Navigation'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          foregroundColor: const Color(0xFF34D399),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => NavigationScreen(deliveryData: _activeDelivery!),
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton(
                        onPressed: _loading
                            ? null
                            : () {
                                final deliveryId = _activeDelivery!['id'] ?? _activeDelivery!['delivery_id'];
                                final isAccepted = _activeDelivery!['status'] == 'ACCEPTED';
                                if (isAccepted) {
                                  _markPickedUp(deliveryId);
                                } else {
                                  _markDelivered(deliveryId);
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF059669),
                          foregroundColor: Colors.white,
                        ),
                        child: Text(_activeDelivery!['status'] == 'ACCEPTED'
                            ? 'Mark Picked Up from Kitchen'
                            : 'Confirm Dropoff with Photo Proof'),
                      ),
                    ],
                  ),
                ),
              ),
            ] else ...[
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(top: 40),
                  child: Column(
                    children: [
                      const Icon(Icons.two_wheeler, size: 48, color: Color(0xFFCBD5E1)),
                      const SizedBox(height: 8),
                      const Text('No active delivery at this moment', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
                      const SizedBox(height: 16),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.map_outlined, size: 16),
                        label: const Text('Preview GPS Route Navigation (Demo)'),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const NavigationScreen(
                                deliveryData: {
                                  'order_number': 'DEMO-7728',
                                  'vendor_name': "Mama's Kitchen (Tanke)",
                                  'delivery_address': 'Plot 14, Fate Road, Ilorin',
                                },
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
