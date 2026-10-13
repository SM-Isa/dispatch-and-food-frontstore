import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/services/api_service.dart';

class VendorScreen extends StatefulWidget {
  const VendorScreen({super.key});

  @override
  State<VendorScreen> createState() => _VendorScreenState();
}

class _VendorScreenState extends State<VendorScreen> {
  bool _loading = false;
  final String _vendorId = '20000000-0000-0000-0000-000000000001'; // Tanke Express Kitchen
  List<dynamic> _orders = [];

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get(ApiConstants.vendorOrders(_vendorId));
      if (res.statusCode == 200) {
        setState(() => _orders = jsonDecode(res.body));
      }
    } catch (_) {
      // Fallback demo orders for simulator preview
      setState(() {
        _orders = [
          {
            'id': 'ord-101',
            'order_number': 'ORD-TK881',
            'status': 'PAID',
            'total_amount': 3200.0,
            'items': [{'name': 'Smoky Jollof Rice & Crispy Chicken', 'quantity': 1}],
            'customer_name': 'Adebayo T.',
            'created_at': DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
          },
          {
            'id': 'ord-102',
            'order_number': 'ORD-TK882',
            'status': 'PREPARING',
            'total_amount': 5000.0,
            'items': [{'name': 'Special Beef Shawarma (Double Sausage)', 'quantity': 2}],
            'customer_name': 'Fatima S.',
            'created_at': DateTime.now().subtract(const Duration(minutes: 12)).toIso8601String(),
          },
        ];
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(String orderId, String newStatus) async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.patch(ApiConstants.updateOrderStatus(orderId), {
        'toStatus': newStatus,
        'note': 'Kitchen updated status via mobile vendor app',
      });

      if (res.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Order status updated to $newStatus')),
          );
        }
        await _fetchOrders();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating status: $e')),
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
        title: const Text('Vendor Kitchen Display', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchOrders,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchOrders,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Kitchen Overview Banner
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text('Tanke Express Kitchen', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                            SizedBox(height: 4),
                            Text('Status: Kitchen Open (Online)', style: TextStyle(color: Color(0xFF34D399), fontSize: 12)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(8)),
                          child: Text('${_orders.length} Active Orders', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  const Text('Incoming Kitchen Queue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 12),

                  if (_orders.isEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.all(32),
                      child: Center(child: Text('No orders in kitchen queue', style: TextStyle(color: Colors.grey))),
                    ),
                  ] else ...[
                    ..._orders.map((order) {
                      final status = order['status'] ?? 'PENDING';
                      final isPaid = status == 'PAID';
                      final isPreparing = status == 'PREPARING';

                      Color badgeColor = const Color(0xFF3B82F6);
                      if (isPaid) badgeColor = const Color(0xFF10B981);
                      if (isPreparing) badgeColor = const Color(0xFFF59E0B);

                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.between,
                                children: [
                                  Text(order['order_number'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(color: badgeColor.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                                    child: Text(status, style: TextStyle(color: badgeColor, fontWeight: FontWeight.bold, fontSize: 11)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text('Customer: ${order['customer_name'] ?? 'App User'}', style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                              const SizedBox(height: 6),
                              Text('Amount: ₦${order['total_amount']}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                              const SizedBox(height: 12),

                              if (isPaid)
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF59E0B), foregroundColor: Colors.white),
                                    onPressed: () => _updateStatus(order['id'], 'PREPARING'),
                                    child: const Text('Accept & Start Cooking'),
                                  ),
                                ),

                              if (isPreparing)
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF059669), foregroundColor: Colors.white),
                                    onPressed: () => _updateStatus(order['id'], 'READY_FOR_PICKUP'),
                                    child: const Text('Mark Food Ready for Rider Pickup'),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
    );
  }
}
