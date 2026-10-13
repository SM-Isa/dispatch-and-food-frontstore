import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/services/api_service.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  double _balance = 0.0;
  List<dynamic> _entries = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadWallet();
  }

  Future<void> _loadWallet() async {
    try {
      final res = await ApiService.get(ApiConstants.riderWallet);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _balance = double.tryParse(data['balance']?.toString() ?? '0') ?? 0.0;
          _entries = data['entries'] ?? [];
        });
      }
    } catch (_) {} finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showPayoutDialog() {
    final amountController = TextEditingController(text: (_balance > 500 ? 500.0 : _balance).toStringAsFixed(0));
    final accountController = TextEditingController(text: '0123456789');
    final nameController = TextEditingController(text: 'Ibrahim Rider');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Request Instant NIP Payout',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount (NGN, min ₦500)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: accountController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'NUBAN Account Number', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Beneficiary Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF047857),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: () async {
                final amt = double.tryParse(amountController.text) ?? 0.0;
                Navigator.pop(ctx);
                await _submitPayout(amt, accountController.text.trim(), nameController.text.trim());
              },
              child: const Text('Confirm Transfer (₦25 NIP Fee)'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitPayout(double amount, String accountNumber, String accountName) async {
    setState(() => _loading = true);
    try {
      final res = await ApiService.post(ApiConstants.requestPayout, {
        'amount': amount,
        'bankCode': '035', // Wema Bank
        'accountNumber': accountNumber,
        'accountName': accountName,
        'provider': 'MONNIFY',
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Payout of ₦$amount initiated successfully!')),
          );
        }
        await _loadWallet();
      } else {
        final err = jsonDecode(res.body);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(err['message'] ?? 'Payout failed')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Network error: $e')),
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
        title: const Text('Rider Earnings & Wallet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Earnings Card
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF047857), Color(0xFF065F46)]),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Available Earnings Balance', style: TextStyle(color: Color(0xFFA7F3D0), fontSize: 13)),
                      const SizedBox(height: 8),
                      Text(
                        '₦${_balance.toStringAsFixed(2)}',
                        style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _showPayoutDialog,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF047857),
                        ),
                        child: const Text('Request Bank Payout →', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Text('Recent Ledger History', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                if (_entries.isEmpty) ...[
                  const Padding(
                    padding: EdgeInsets.all(32),
                    child: Center(child: Text('No delivery ledger entries yet', style: TextStyle(color: Colors.grey))),
                  ),
                ] else ...[
                  ..._entries.map((entry) => Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(entry['description'] ?? 'Delivery Payout', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                          trailing: Text(
                            '+₦${entry['amount']}',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                          ),
                        ),
                      )),
                ],
              ],
            ),
    );
  }
}
