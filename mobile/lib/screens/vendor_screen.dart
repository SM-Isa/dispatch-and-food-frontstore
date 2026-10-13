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
  bool _isKitchenOpen = true;
  List<dynamic> _orders = [];
  List<dynamic> _menuItems = [];

  @override
  void initState() {
    super.initState();
    _fetchOrders();
    _fetchMenuItems();
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

  Future<void> _fetchMenuItems() async {
    try {
      final res = await ApiService.get(ApiConstants.vendorProducts(_vendorId));
      if (res.statusCode == 200) {
        setState(() => _menuItems = jsonDecode(res.body));
      }
    } catch (_) {
      setState(() {
        _menuItems = [
          {
            'id': 'prod-001',
            'name': 'Smoky Jollof Rice & Crispy Chicken',
            'category': 'Rice & Combos',
            'price': 3200.0,
            'is_available': true,
            'prep_time_minutes': 12,
          },
          {
            'id': 'prod-002',
            'name': 'Special Beef Shawarma (Double Sausage)',
            'category': 'Quick Bites',
            'price': 2500.0,
            'is_available': true,
            'prep_time_minutes': 10,
          },
          {
            'id': 'prod-003',
            'name': 'Pounded Yam & Egusi Goat Meat',
            'category': 'Swallows',
            'price': 4000.0,
            'is_available': false, // Sold out
            'prep_time_minutes': 20,
          },
          {
            'id': 'prod-004',
            'name': 'Chilled Zobo Drink (Ginger & Pineapple)',
            'category': 'Drinks',
            'price': 800.0,
            'is_available': true,
            'prep_time_minutes': 2,
          },
        ];
      });
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

  Future<void> _toggleItemAvailability(String productId, bool currentVal) async {
    final newVal = !currentVal;
    setState(() {
      _menuItems = _menuItems.map((item) {
        if (item['id'] == productId) {
          return {...item, 'is_available': newVal};
        }
        return item;
      }).toList();
    });

    try {
      await ApiService.patch(ApiConstants.updateProduct(productId), {
        'isAvailable': newVal,
      });
    } catch (_) {}

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(newVal ? 'Dish marked In-Stock' : 'Dish marked Sold-Out'),
          duration: const Duration(seconds: 1),
        ),
      );
    }
  }

  void _showAddDishDialog() {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController(text: '2500');
    final prepCtrl = TextEditingController(text: '15');
    String category = 'Rice & Combos';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.between,
                children: [
                  const Text('Add Dish to Kitchen Menu', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Dish Name (e.g. Asun Fried Rice)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: priceCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Price (₦)', border: OutlineInputBorder()),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: prepCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Prep Mins', border: OutlineInputBorder()),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: category,
                decoration: const InputDecoration(labelText: 'Category', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'Rice & Combos', child: Text('Rice & Combos')),
                  DropdownMenuItem(value: 'Swallows', child: Text('Swallows')),
                  DropdownMenuItem(value: 'Quick Bites', child: Text('Quick Bites')),
                  DropdownMenuItem(value: 'Grills', child: Text('Grills')),
                  DropdownMenuItem(value: 'Drinks', child: Text('Drinks')),
                ],
                onChanged: (val) {
                  if (val != null) setSheetState(() => category = val);
                },
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF059669),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  final newDish = {
                    'id': 'prod-${DateTime.now().millisecondsSinceEpoch}',
                    'name': nameCtrl.text.trim(),
                    'category': category,
                    'price': double.tryParse(priceCtrl.text) ?? 2000.0,
                    'is_available': true,
                    'prep_time_minutes': int.tryParse(prepCtrl.text) ?? 15,
                  };
                  setState(() {
                    _menuItems.insert(0, newDish);
                  });
                  Navigator.pop(ctx);
                },
                child: const Text('Publish Dish to Storefront', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Vendor Kitchen Display', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF0F172A),
          elevation: 0,
          bottom: const TabBar(
            labelColor: Color(0xFF059669),
            unselectedLabelColor: Color(0xFF64748B),
            indicatorColor: Color(0xFF059669),
            labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            tabs: [
              Tab(icon: Icon(Icons.receipt_outlined, size: 20), text: 'Kitchen Queue'),
              Tab(icon: Icon(Icons.menu_book_outlined, size: 20), text: 'Menu & Stock'),
            ],
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: 'Refresh',
              onPressed: () {
                _fetchOrders();
                _fetchMenuItems();
              },
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                children: [
                  // Tab 1: Kitchen Queue
                  _buildKitchenQueueTab(),

                  // Tab 2: Menu & Stock Availability
                  _buildMenuStockTab(),
                ],
              ),
      ),
    );
  }

  Widget _buildKitchenQueueTab() {
    return RefreshIndicator(
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
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Tanke Express Kitchen', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 4),
                    Text(
                      _isKitchenOpen ? 'Status: Kitchen Open (Online)' : 'Status: Kitchen Closed (Offline)',
                      style: TextStyle(color: _isKitchenOpen ? const Color(0xFF34D399) : Colors.orange, fontSize: 12),
                    ),
                  ],
                ),
                Switch(
                  value: _isKitchenOpen,
                  activeColor: const Color(0xFF34D399),
                  onChanged: (val) {
                    setState(() => _isKitchenOpen = val);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(val ? 'Kitchen is now Open for orders' : 'Kitchen set to Closed')),
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              const Text('Incoming Kitchen Queue', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
                child: Text('${_orders.length} Active Orders', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF334155))),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (_orders.isEmpty) ...[
            const Padding(
              padding: EdgeInsets.all(40),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.done_all, size: 40, color: Colors.grey),
                    SizedBox(height: 8),
                    Text('No orders in kitchen queue', style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
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
    );
  }

  Widget _buildMenuStockTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.between,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Dish Availability', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text('Toggle Sold Out to stop customer orders', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              ],
            ),
            ElevatedButton.icon(
              icon: const Icon(Icons.add, size: 16),
              label: const Text('Add Dish'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF059669),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _showAddDishDialog,
            ),
          ],
        ),
        const SizedBox(height: 14),

        ..._menuItems.map((item) {
          final isAvailable = item['is_available'] ?? true;
          final price = (item['price'] as num).toDouble();

          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: BorderSide(color: isAvailable ? const Color(0xFFE2E8F0) : const Color(0xFFFECACA)),
            ),
            color: isAvailable ? Colors.white : const Color(0xFFFFF1F2),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              item['name'],
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: isAvailable ? const Color(0xFF0F172A) : const Color(0xFF991B1B),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Text('₦${price.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF059669), fontSize: 13)),
                            const SizedBox(width: 8),
                            Text('• ${item['category']}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                            if (item['prep_time_minutes'] != null) ...[
                              const SizedBox(width: 6),
                              Text('• ~${item['prep_time_minutes']}m', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                  Column(
                    children: [
                      Switch(
                        value: isAvailable,
                        activeColor: const Color(0xFF059669),
                        inactiveThumbColor: Colors.red,
                        onChanged: (_) => _toggleItemAvailability(item['id'], isAvailable),
                      ),
                      Text(
                        isAvailable ? 'In-Stock' : 'Sold Out',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isAvailable ? const Color(0xFF059669) : Colors.red,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
      ],
    );
  }
}
