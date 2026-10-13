import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/services/api_service.dart';

class CustomerScreen extends StatefulWidget {
  const CustomerScreen({super.key});

  @override
  State<CustomerScreen> createState() => _CustomerScreenState();
}

class _CustomerScreenState extends State<CustomerScreen> {
  bool _loading = false;
  List<dynamic> _vendors = [];
  Map<String, dynamic>? _selectedVendor;
  List<dynamic> _products = [];
  final Map<String, int> _cart = {}; // productId -> quantity
  Map<String, dynamic>? _activePayment;

  @override
  void initState() {
    super.initState();
    _fetchVendors();
  }

  Future<void> _fetchVendors() async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.get(ApiConstants.vendors);
      if (res.statusCode == 200) {
        setState(() => _vendors = jsonDecode(res.body));
      }
    } catch (_) {
      // Fallback sample data for offline / initial simulator demo
      setState(() {
        _vendors = [
          {
            'id': '20000000-0000-0000-0000-000000000001',
            'store_name': 'Tanke Express Kitchen',
            'cluster_zone': 'TANKE',
            'address_text': '14 University Road, Tanke, Ilorin',
            'is_open': true,
          },
          {
            'id': '20000000-0000-0000-0000-000000000002',
            'store_name': 'GRA Grill House & Smoothies',
            'cluster_zone': 'GRA',
            'address_text': '8 Ahmadu Bello Way, GRA, Ilorin',
            'is_open': true,
          },
        ];
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _selectVendor(Map<String, dynamic> vendor) async {
    setState(() {
      _selectedVendor = vendor;
      _cart.clear();
      _loading = true;
    });

    try {
      final res = await ApiService.get(ApiConstants.vendorProducts(vendor['id']));
      if (res.statusCode == 200) {
        setState(() => _products = jsonDecode(res.body));
      }
    } catch (_) {
      setState(() {
        _products = [
          {
            'id': '30000000-0000-0000-0000-000000000001',
            'name': 'Smoky Jollof Rice & Crispy Chicken',
            'description': 'Party jollof with spiced grilled chicken & dodo',
            'price': 3200.0,
            'category': 'Rice & Combos',
          },
          {
            'id': '30000000-0000-0000-0000-000000000002',
            'name': 'Special Beef Shawarma (Double Sausage)',
            'description': 'Fresh pita loaded with shredded beef & sausages',
            'price': 2500.0,
            'category': 'Quick Bites',
          },
        ];
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  double get _cartTotal {
    double total = 0.0;
    for (final entry in _cart.entries) {
      final product = _products.firstWhere((p) => p['id'] == entry.key, orElse: () => null);
      if (product != null) {
        total += (double.tryParse(product['price'].toString()) ?? 0.0) * entry.value;
      }
    }
    return total;
  }

  Future<void> _checkout() async {
    if (_cart.isEmpty || _selectedVendor == null) return;
    setState(() => _loading = true);

    try {
      final items = _cart.entries
          .map((e) => {'productId': e.key, 'quantity': e.value})
          .toList();

      // 1. Create Order
      final orderRes = await ApiService.post(ApiConstants.createOrder, {
        'vendorId': _selectedVendor!['id'],
        'items': items,
        'deliveryAddress': 'Tanke Junction, Ilorin',
      });

      if (orderRes.statusCode == 200 || orderRes.statusCode == 201) {
        final order = jsonDecode(orderRes.body);

        // 2. Initiate Payment (Dynamic Virtual Account)
        final payRes = await ApiService.post(ApiConstants.initiatePayment(order['id']), {});
        if (payRes.statusCode == 200 || payRes.statusCode == 201) {
          final payData = jsonDecode(payRes.body);
          setState(() {
            _activePayment = payData['virtualAccount'];
            _cart.clear();
          });
          _showVirtualAccountDialog(order['order_number'] ?? 'ORD-NEW');
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Checkout error: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showVirtualAccountDialog(String orderNumber) {
    if (_activePayment == null) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: const [
            Icon(Icons.account_balance, color: Color(0xFF059669)),
            SizedBox(width: 8),
            Text('Bank Transfer Checkout', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Order Reference: $orderNumber', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Pay to Dynamic Virtual Account:', style: TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                  const SizedBox(height: 6),
                  Text('Bank: ${_activePayment!['bankName']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(
                    'Account Number: ${_activePayment!['accountNumber']}',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF0F172A)),
                  ),
                  Text('Amount: ₦${_activePayment!['amount']}', style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              '⚡ Payment detects automatically within seconds via Monnify / NIP webhook.',
              style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedVendor == null ? 'Customer Food Storefront' : _selectedVendor!['store_name']),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        leading: _selectedVendor != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _selectedVendor = null),
              )
            : null,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _selectedVendor == null
              ? _buildVendorList()
              : _buildMenuList(),
      bottomNavigationBar: _selectedVendor != null && _cart.isNotEmpty
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8)],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Total Bill', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                          Text('₦${_cartTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                      onPressed: _checkout,
                      child: const Text('Checkout & Pay →', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }

  Widget _buildVendorList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _vendors.length,
      itemBuilder: (ctx, idx) {
        final vendor = _vendors[idx];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: const CircleAvatar(
              backgroundColor: Color(0xFFE2E8F0),
              child: Icon(Icons.restaurant, color: Color(0xFF059669)),
            ),
            title: Text(vendor['store_name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 4),
                Text(vendor['address_text'] ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(6)),
                  child: Text('Zone: ${vendor['cluster_zone']}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
                ),
              ],
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => _selectVendor(vendor),
          ),
        );
      },
    );
  }

  Widget _buildMenuList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _products.length,
      itemBuilder: (ctx, idx) {
        final product = _products[idx];
        final qty = _cart[product['id']] ?? 0;
        final price = double.tryParse(product['price'].toString()) ?? 0.0;

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(product['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 4),
                      Text(product['description'] ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      const SizedBox(height: 6),
                      Text('₦${price.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF059669), fontSize: 14)),
                    ],
                  ),
                ),
                Row(
                  children: [
                    if (qty > 0) ...[
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                        onPressed: () {
                          setState(() {
                            if (qty == 1) {
                              _cart.remove(product['id']);
                            } else {
                              _cart[product['id']] = qty - 1;
                            }
                          });
                        },
                      ),
                      Text('$qty', style: const TextStyle(fontWeight: FontWeight.bold)),
                    ],
                    IconButton(
                      icon: const Icon(Icons.add_circle, color: Color(0xFF059669)),
                      onPressed: () {
                        setState(() {
                          _cart[product['id']] = qty + 1;
                        });
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
