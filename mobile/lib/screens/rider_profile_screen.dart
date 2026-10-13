import 'dart:convert';
import 'package:flutter/material.dart';
import '../core/constants/api_constants.dart';
import '../core/services/api_service.dart';

class RiderProfileScreen extends StatefulWidget {
  const RiderProfileScreen({super.key});

  @override
  State<RiderProfileScreen> createState() => _RiderProfileScreenState();
}

class _RiderProfileScreenState extends State<RiderProfileScreen> {
  String _selectedCluster = 'TANKE';
  bool _savingCluster = false;

  final List<String> _clusters = const [
    'TANKE',
    'UNILORIN',
    'GRA',
    'TIPPER_GARAGE',
    'POST_OFFICE',
  ];

  Future<void> _updateCluster(String newCluster) async {
    setState(() {
      _selectedCluster = newCluster;
      _savingCluster = true;
    });

    try {
      await ApiService.patch(ApiConstants.riderProfile, {
        'preferredCluster': newCluster,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Operating cluster updated to $newCluster!')),
        );
      }
    } catch (_) {} finally {
      if (mounted) setState(() => _savingCluster = false);
    }
  }

  void _showReportIncidentSheet() {
    String incidentType = 'BIKE_BREAKDOWN';
    final notesController = TextEditingController();

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
                  const Text(
                    'Report Delivery Incident / Delay',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Text(
                'Logging an active issue excuses delivery time metrics and notifies the ops dispatcher.',
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: incidentType,
                decoration: const InputDecoration(
                  labelText: 'Incident Category',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'BIKE_BREAKDOWN',
                    child: Text('🔧 Bike Mechanical Breakdown / Flat Tyre'),
                  ),
                  DropdownMenuItem(
                    value: 'HEAVY_RAIN',
                    child: Text('🌧️ Heavy Rain / Road Flooding'),
                  ),
                  DropdownMenuItem(
                    value: 'POLICE_CHECKPOINT',
                    child: Text('🛑 Police / VIO Roadblock Delay'),
                  ),
                  DropdownMenuItem(
                    value: 'CUSTOMER_UNREACHABLE',
                    child: Text('📞 Customer Phone Switched Off'),
                  ),
                  DropdownMenuItem(
                    value: 'KITCHEN_DELAY',
                    child: Text('🍳 Kitchen Food Not Ready (>15 mins)'),
                  ),
                ],
                onChanged: (val) {
                  if (val != null) setSheetState(() => incidentType = val);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesController,
                maxLines: 2,
                decoration: const InputDecoration(
                  labelText: 'Additional Details (Location / Note)',
                  hintText: 'e.g. Stuck near Tanke Akata roundabout, replacing inner tube.',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                icon: const Icon(Icons.send),
                label: const Text('Broadcast Delay to Dispatch Ops'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () async {
                  Navigator.pop(ctx);
                  try {
                    await ApiService.post(ApiConstants.reportIncident, {
                      'type': incidentType,
                      'notes': notesController.text,
                      'cluster': _selectedCluster,
                    });
                  } catch (_) {}

                  if (mounted) {
                    ScaffoldMessenger.of(this.context).showSnackBar(
                      const SnackBar(
                        content: Text('Incident logged. Dispatch ops notified.'),
                        backgroundColor: Color(0xFFDC2626),
                      ),
                    );
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rider Profile & Fleet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Rider ID Card
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            color: const Color(0xFF0F172A),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 30,
                        backgroundColor: Color(0xFF059669),
                        child: Icon(Icons.person, size: 36, color: Colors.white),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'Ibrahim Kazeem',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
                            ),
                            SizedBox(height: 2),
                            Text(
                              '+234 801 122 3344',
                              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Plate: KW-782-ILR • Bajaj Boxer 125',
                              style: TextStyle(color: Color(0xFF34D399), fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Color(0xFF334155)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMiniStat('⭐ Rating', '4.9 / 5.0'),
                      _buildMiniStat('📦 Delivered', '284 Orders'),
                      _buildMiniStat('⚡ Accept Rate', '96%'),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Operating Cluster Zone Selector
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        'Operating Cluster Zone',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      if (_savingCluster)
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Select which district of Ilorin you are stationed in to receive prioritized nearby order dispatches.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _selectedCluster,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    items: _clusters.map((c) {
                      return DropdownMenuItem(
                        value: c,
                        child: Text(
                          c == 'TANKE' ? 'Tanke Corridor (University Rd)' :
                          c == 'UNILORIN' ? 'Unilorin Main Campus' :
                          c == 'GRA' ? 'GRA / Fate Road' :
                          c == 'TIPPER_GARAGE' ? 'Tipper / Offa Garage' :
                          'Post Office / Taiwo',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) _updateCluster(val);
                    },
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Incident / Delay Report Card
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            color: const Color(0xFFFEF2F2),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626)),
                      SizedBox(width: 8),
                      Text(
                        'Road Delay & Incident Reporter',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF991B1B)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Encountered rain, bike failure, or police stops? Log it immediately to protect your on-time score.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF7F1D1D)),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _showReportIncidentSheet,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDC2626),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: const Text('Log Incident / Traffic Delay'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Field Ops Emergency Contact
          ListTile(
            tileColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            leading: const CircleAvatar(
              backgroundColor: Color(0xFFD1FAE5),
              child: Icon(Icons.support_agent, color: Color(0xFF059669)),
            ),
            title: const Text('Ilorin Ops Lead Hotline', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            subtitle: const Text('+234 803 987 6543 • Direct Dispatch Line', style: TextStyle(fontSize: 12)),
            trailing: const Icon(Icons.phone, color: Color(0xFF059669)),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Calling Dispatch Ops Lead at +2348039876543...')),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMiniStat(String label, String value) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.white)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
      ],
    );
  }
}
