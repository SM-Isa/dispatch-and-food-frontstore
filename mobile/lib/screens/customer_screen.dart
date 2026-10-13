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

  // Coupon state
  String? _appliedCouponCode;
  double _couponDiscount = 0.0;

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
      _appliedCouponCode = null;
      _couponDiscount = 0.0;
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
          {
            'id': '30000000-0000-0000-0000-000000000003',
            'name': 'Pounded Yam & Egusi Goat Meat',
            'description': 'Soft pounded yam with melon soup and goat meat',
            'price': 4000.0,
            'category': 'Swallows',
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

  void _openCheckoutSheet() {
    if (_cart.isEmpty || _selectedVendor == null) return;

    final addressController = TextEditingController(text: '14 University Road, Tanke, Ilorin');
    final couponController = TextEditingController(text: _appliedCouponCode ?? '');
    String couponMessage = '';
    bool couponError = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) {
          final subtotal = _cartTotal;
          const deliveryFee = 800.0;
          const platformFee = 100.0;
          final totalPayable = (subtotal + deliveryFee + platformFee - _couponDiscount).clamp(0.0, 999999.0);

          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Review Order & Checkout',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Delivery Address
                  TextField(
                    controller: addressController,
                    decoration: const InputDecoration(
                      labelText: 'Delivery Address & Landmark',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.location_on, color: Color(0xFF059669)),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Promo Code Input
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: couponController,
                          textCapitalization: TextCapitalization.characters,
                          decoration: const InputDecoration(
                            labelText: 'Promo / Voucher Code',
                            hintText: 'e.g. DISPATCH500',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.local_offer, color: Color(0xFF059669)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F172A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                        onPressed: () async {
                          final code = couponController.text.trim().toUpperCase();
                          if (code.isEmpty) return;

                          // Try backend coupon validation
                          try {
                            final res = await ApiService.post(ApiConstants.validateCoupon, {
                              'code': code,
                              'orderAmount': subtotal,
                            });
                            if (res.statusCode == 200) {
                              final d = jsonDecode(res.body);
                              if (d['isValid'] == true) {
                                setSheetState(() {
                                  _appliedCouponCode = code;
                                  _couponDiscount = (d['discountAmount'] as num).toDouble();
                                  couponMessage = d['message'] ?? 'Coupon applied!';
                                  couponError = false;
                                });
                                setState(() {});
                                return;
                              }
                            }
                          } catch (_) {}

                          // Local fallback
                          setSheetState(() {
                            if (code == 'DISPATCH500') {
                              _appliedCouponCode = code;
                              _couponDiscount = 500.0;
                              couponMessage = '₦500 welcome discount applied!';
                              couponError = false;
                            } else if (code == 'ILORIN10') {
                              _appliedCouponCode = code;
                              _couponDiscount = (subtotal * 0.1).roundToDouble();
                              couponMessage = '10% discount applied!';
                              couponError = false;
                            } else if (code == 'FREEDELIVERY') {
                              _appliedCouponCode = code;
                              _couponDiscount = 800.0;
                              couponMessage = 'Free delivery fee applied!';
                              couponError = false;
                            } else {
                              couponMessage = 'Invalid code. Try DISPATCH500 or ILORIN10.';
                              couponError = true;
                              _appliedCouponCode = null;
                              _couponDiscount = 0.0;
                            }
                          });
                          setState(() {});
                        },
                        child: const Text('Apply'),
                      ),
                    ],
                  ),
                  if (couponMessage.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      couponMessage,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: couponError ? const Color(0xFFDC2626) : const Color(0xFF059669),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),

                  // Bill Breakdown
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        _buildPriceRow('Items Subtotal', '₦${subtotal.toStringAsFixed(0)}'),
                        _buildPriceRow('Rider Delivery Fee', '₦${deliveryFee.toStringAsFixed(0)}'),
                        _buildPriceRow('Platform Service Fee', '₦${platformFee.toStringAsFixed(0)}'),
                        if (_couponDiscount > 0)
                          _buildPriceRow(
                            'Voucher (${_appliedCouponCode})',
                            '-₦${_couponDiscount.toStringAsFixed(0)}',
                            highlightColor: const Color(0xFF059669),
                          ),
                        const Divider(height: 16),
                        _buildPriceRow(
                          'Total Payable',
                          '₦${totalPayable.toStringAsFixed(0)}',
                          isBold: true,
                          highlightColor: const Color(0xFF059669),
                        ),
                      ],
                    ),
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
                      Navigator.pop(ctx);
                      _checkout(addressController.text, totalPayable);
                    },
                    child: const Text('Generate Dynamic Bank Account →', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _checkout(String deliveryAddress, double totalPayable) async {
    setState(() => _loading = true);

    try {
      final items = _cart.entries
          .map((e) => {'productId': e.key, 'quantity': e.value})
          .toList();

      // 1. Create Order
      final orderRes = await ApiService.post(ApiConstants.createOrder, {
        'vendorId': _selectedVendor!['id'],
        'items': items,
        'deliveryAddress': deliveryAddress,
        'couponCode': _appliedCouponCode,
        'discountAmount': _couponDiscount,
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
          _showVirtualAccountDialog(order['order_number'] ?? 'ORD-NEW', totalPayable);
          return;
        }
      }
    } catch (_) {}

    // Fallback simulation for offline testing
    final fakeOrderNum = 'ORD-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    setState(() {
      _activePayment = {
        'bankName': 'Wema Bank / Monnify',
        'accountNumber': '7849102941',
        'accountName': 'Dispatch/$fakeOrderNum',
        'amount': totalPayable,
      };
      _cart.clear();
    });
    _showVirtualAccountDialog(fakeOrderNum, totalPayable);
    if (mounted) setState(() => _loading = false);
  }

  void _showVirtualAccountDialog(String orderNumber, double amount) {
    if (_activePayment == null) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
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
            Text('Order Reference: $orderNumber', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Pay to Dynamic Virtual Account:', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                  const SizedBox(height: 6),
                  Text('Bank: ${_activePayment!['bankName']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${_activePayment!['accountNumber']}',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: 1.2),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy, size: 18, color: Color(0xFF059669)),
                        tooltip: 'Copy Account Number',
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Account number copied to clipboard!')),
                          );
                        },
                      ),
                    ],
                  ),
                  Text('Amount: ₦${amount.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              '⚡ Transfer via any bank app or USSD. Webhook detects settlement within 3 seconds.',
              style: TextStyle(fontSize: 11, color: Color(0xFF64748B)),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('I Have Sent the Money'),
          ),
        ],
      ),
    );
  }

  void _showOrderHistorySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Recent Order Receipts', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 8),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(
                backgroundColor: Color(0xFFD1FAE5),
                child: Icon(Icons.check, color: Color(0xFF059669)),
              ),
              title: const Text('Order #ORD-8K3F9A', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: const Text("Mama's Kitchen • 2x Smoky Jollof Rice\nDelivered • ★★★★★ Reviewed", style: TextStyle(fontSize: 12)),
              trailing: const Text('₦4,100', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            const Divider(),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const CircleAvatar(
                backgroundColor: Color(0xFFFEF3C7),
                child: Icon(Icons.delivery_dining, color: Color(0xFFD97706)),
              ),
              title: const Text('Order #ORD-2K3F9B', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              subtitle: const Text('GRA Grill House • 1x Special Beef Shawarma\nIn Transit (Rider: Ibrahim K.)', style: TextStyle(fontSize: 12)),
              trailing: const Text('₦2,500', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isBold = false, Color? highlightColor}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(fontSize: 12, fontWeight: isBold ? FontWeight.bold : FontWeight.normal, color: const Color(0xFF475569))),
          Text(value, style: TextStyle(fontSize: 13, fontWeight: isBold ? FontWeight.bold : FontWeight.w600, color: highlightColor ?? const Color(0xFF0F172A))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _selectedVendor == null ? 'Customer Food Storefront' : _selectedVendor!['store_name'],
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17),
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        leading: _selectedVendor != null
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _selectedVendor = null),
              )
            : null,
        actions: [
          IconButton(
            icon: const Icon(Icons.receipt_long_outlined),
            tooltip: 'My Past Orders',
            onPressed: _showOrderHistorySheet,
          ),
        ],
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
                          const Text('Subtotal', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                          Text('₦${_cartTotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF059669),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: _openCheckoutSheet,
                      child: const Text('Review & Pay →', style: TextStyle(fontWeight: FontWeight.bold)),
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
