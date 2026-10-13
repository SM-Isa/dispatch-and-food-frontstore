-- ============================================================================
-- Dispatch Rider Aggregator & Food Vendor Storefront
-- Initial Seed Data: Chart of Accounts, System Wallets, Sample Clusters
-- ============================================================================

-- 1. System Platform Users & Wallets
INSERT INTO users (id, phone_number, full_name, email, role, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000001', '+2348000000001', 'Platform System Admin', 'admin@dispatchaggregator.ng', 'ADMIN', true),
  ('00000000-0000-0000-0000-000000000002', '+2348000000002', 'Platform Operations Support', 'support@dispatchaggregator.ng', 'SUPPORT', true)
ON CONFLICT (phone_number) DO NOTHING;

-- System Platform-Owned Singleton Wallets (owner_id = NULL)
INSERT INTO wallets (id, owner_id, ledger_type, currency, balance, is_locked)
VALUES
  ('10000000-0000-0000-0000-000000000001', NULL, 'PLATFORM', 'NGN', 0.00, false),
  ('10000000-0000-0000-0000-000000000002', NULL, 'CUSTOMER_ESCROW', 'NGN', 0.00, false),
  ('10000000-0000-0000-0000-000000000003', NULL, 'BANK_SETTLEMENT', 'NGN', 0.00, false),
  ('10000000-0000-0000-0000-000000000004', NULL, 'RIDER_POOL', 'NGN', 0.00, false),
  ('10000000-0000-0000-0000-000000000005', NULL, 'REFUND_POOL', 'NGN', 0.00, false),
  ('10000000-0000-0000-0000-000000000006', NULL, 'PAYOUT_IN_TRANSIT', 'NGN', 0.00, false),
  ('10000000-0000-0000-0000-000000000007', NULL, 'PLATFORM_LOSS', 'NGN', 0.00, false)
ON CONFLICT (owner_id, ledger_type, currency) DO NOTHING;

-- 2. Sample Vendor 1 (Tanke Cluster - Fast Food & Shawarma)
INSERT INTO users (id, phone_number, full_name, email, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000010', '+2348011112222', 'Chef Adebayo', 'adebayo@tankeexpress.ng', 'VENDOR_OWNER', true)
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO vendors (id, user_id, store_name, slug, cluster_zone, location, address_text, is_active, is_open, phone_number, commission_bps)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  'Tanke Express Kitchen',
  'tanke-express',
  'TANKE',
  ST_SetSRID(ST_MakePoint(4.5823, 8.4831), 4326)::geography, -- Tanke, Ilorin coordinates
  '14 University Road, Tanke, Ilorin',
  true,
  true,
  '+2348011112222',
  1500 -- 15.00% platform commission
)
ON CONFLICT (slug) DO NOTHING;

-- Vendor Wallet
INSERT INTO wallets (id, owner_id, ledger_type, currency, balance, is_locked)
VALUES ('10000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000010', 'VENDOR', 'NGN', 0.00, false)
ON CONFLICT (owner_id, ledger_type, currency) DO NOTHING;

-- Vendor 1 Products
INSERT INTO products (id, vendor_id, name, description, price, is_available, is_published, category, sort_order)
VALUES
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Smoky Jollof Rice & Crispy Chicken', 'Authentic Nigerian party jollof with spiced grilled chicken and fried plantain', 3200.00, true, true, 'Rice & Combos', 1),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Special Beef Shawarma (Double Sausage)', 'Freshly grilled pita loaded with shredded beef, spicy mayo, and two sausages', 2500.00, true, true, 'Quick Bites', 2),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Fried Rice & Peppered Turkey', 'Stir-fried savoury rice with diced vegetables and juicy peppered turkey', 4500.00, true, true, 'Rice & Combos', 3)
ON CONFLICT DO NOTHING;

-- 3. Sample Vendor 2 (GRA Cluster - Grills & Desserts)
INSERT INTO users (id, phone_number, full_name, email, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000020', '+2348033334444', 'Fatima Aliyu', 'fatima@gragrillhouse.ng', 'VENDOR_OWNER', true)
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO vendors (id, user_id, store_name, slug, cluster_zone, location, address_text, is_active, is_open, phone_number, commission_bps)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000020',
  'GRA Grill House & Smoothies',
  'gra-grill-house',
  'GRA',
  ST_SetSRID(ST_MakePoint(4.5450, 8.4710), 4326)::geography, -- GRA, Ilorin coordinates
  '8 Ahmadu Bello Way, GRA, Ilorin',
  true,
  true,
  '+2348033334444',
  1200 -- 12.00%
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO wallets (id, owner_id, ledger_type, currency, balance, is_locked)
VALUES ('10000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000020', 'VENDOR', 'NGN', 0.00, false)
ON CONFLICT (owner_id, ledger_type, currency) DO NOTHING;

INSERT INTO products (id, vendor_id, name, description, price, is_available, is_published, category, sort_order)
VALUES
  ('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000002', 'Full Grilled Catfish with Spicy Sauce', 'Oven-roasted catfish seasoned with local herbs, served with spicy dip and chips', 7500.00, true, true, 'Grills', 1),
  ('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000002', 'Fresh Mango & Pineapple Smoothie', 'Pure chilled fresh fruit blend with natural honey', 1800.00, true, true, 'Beverages', 2)
ON CONFLICT DO NOTHING;

-- 4. Sample Riders (Approved with Guarantors)
INSERT INTO users (id, phone_number, full_name, email, role, is_active)
VALUES 
  ('00000000-0000-0000-0000-000000000030', '+2348055556666', 'Musa Ibrahim', 'musa@rider.ng', 'RIDER', true),
  ('00000000-0000-0000-0000-000000000031', '+2348077778888', 'Emmanuel Okafor', 'emmanuel@rider.ng', 'RIDER', true)
ON CONFLICT (phone_number) DO NOTHING;

INSERT INTO riders (id, user_id, vehicle_type, vehicle_plate, guarantor_name, guarantor_phone, current_cluster, is_online, is_approved, last_location, commission_bps)
VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000030',
    'BAJAJ_BOXER_150',
    'KW-892-LRN',
    'Alhaji Usman Ibrahim',
    '+2348021112233',
    'TANKE',
    true,
    true,
    ST_SetSRID(ST_MakePoint(4.5810, 8.4820), 4326)::geography,
    2000 -- 20.00% payout cut
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000031',
    'TVS_HLX_125',
    'KW-415-GRA',
    'Chief Daniel Okafor',
    '+2348032223344',
    'GRA',
    true,
    true,
    ST_SetSRID(ST_MakePoint(4.5460, 8.4720), 4326)::geography,
    2000
  )
ON CONFLICT (user_id) DO NOTHING;

-- Rider Wallets
INSERT INTO wallets (id, owner_id, ledger_type, currency, balance, is_locked)
VALUES 
  ('10000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000030', 'RIDER', 'NGN', 0.00, false),
  ('10000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000031', 'RIDER', 'NGN', 0.00, false)
ON CONFLICT (owner_id, ledger_type, currency) DO NOTHING;

-- 5. Sample Customer
INSERT INTO users (id, phone_number, full_name, email, role, is_active)
VALUES ('00000000-0000-0000-0000-000000000040', '+2348099990000', 'Zainab Balogun', 'zainab@gmail.com', 'CUSTOMER', true)
ON CONFLICT (phone_number) DO NOTHING;

-- 6. Initial AI Prompts Registry
INSERT INTO prompts (key, version, model, template, eval_score, is_active)
VALUES 
  ('menu_extract_vision', 1, 'gemini-1.5-flash-vision', 'Extract all food items, prices, descriptions, and bounding boxes from the provided menu image.', 0.940, true),
  ('whatsapp_intent_parser', 1, 'gemini-1.5-pro', 'You are an intelligent food ordering assistant for Nigerian tier-2 cities. Parse user intent and order schema.', 0.950, true),
  ('support_ticket_triage', 1, 'gemini-1.5-flash', 'Classify support tickets into ORDER_STATUS, WHERE_IS_RIDER, REFUND_DISPUTE, FOOD_QUALITY, or RIDER_CONDUCT.', 0.930, true)
ON CONFLICT (key, version) DO NOTHING;
