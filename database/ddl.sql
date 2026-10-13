-- ============================================================================
-- Dispatch Rider Aggregator & Food Vendor Storefront
-- Production PostgreSQL DDL (PostgreSQL 14+, PostGIS 3+, pgcrypto, citext)
-- ============================================================================

-- 0. Extensions & Enums
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "citext";

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CUSTOMER','VENDOR_OWNER','RIDER','ADMIN','SUPPORT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
      'PENDING','PAID','PAYMENT_FAILED','PREPARING',
      'AWAITING_RIDER','RIDER_ASSIGNED','PICKED_UP','DELIVERED',
      'COMPLETED','CANCELLED','REFUNDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE delivery_status AS ENUM ('LOOKING_FOR_RIDER','ACCEPTED','PICKED_UP','DELIVERED','FAILED','CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE wallet_type AS ENUM (
      'VENDOR','RIDER','PLATFORM','CUSTOMER_ESCROW','RIDER_POOL',
      'PAYOUT_IN_TRANSIT','BANK_SETTLEMENT','PLATFORM_LOSS','REFUND_POOL'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ledger_direction AS ENUM ('CREDIT','DEBIT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_code AS ENUM (
      'CUSTOMER_ESCROW','PSP_RECEIVABLE','VENDOR_PAYABLE','RIDER_PAYABLE',
      'PLATFORM_REVENUE','REFUND_PAYABLE','PLATFORM_LOSS','PAYOUT_IN_TRANSIT','BANK_SETTLEMENT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('PENDING','PROCESSING','PAID','FAILED','REVERSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dispatch_response AS ENUM ('OFFERED','ACCEPTED','REJECTED','TIMED_OUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('SMS','PUSH','WHATSAPP','EMAIL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('PENDING','SENT','FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. users
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number      VARCHAR(20) UNIQUE NOT NULL,
  phone_verified_at TIMESTAMPTZ,
  email             CITEXT UNIQUE,
  full_name         VARCHAR(120),
  role              user_role NOT NULL DEFAULT 'CUSTOMER',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone        ON users(phone_number);

-- 2. otp_codes
CREATE TABLE IF NOT EXISTS otp_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  code_hash    TEXT NOT NULL,
  purpose      VARCHAR(30) NOT NULL,
  attempts     SMALLINT NOT NULL DEFAULT 0,
  max_attempts SMALLINT NOT NULL DEFAULT 5,
  expires_at   TIMESTAMPTZ NOT NULL,
  consumed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_otp_phone_purpose ON otp_codes(phone_number, purpose, expires_at DESC);

-- 2a. sessions
CREATE TABLE IF NOT EXISTS sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_jti    VARCHAR(64) UNIQUE NOT NULL,
  device_id      VARCHAR(120) NOT NULL,
  user_agent     TEXT,
  ip_address     VARCHAR(45),
  expires_at     TIMESTAMPTZ NOT NULL,
  revoked_at     TIMESTAMPTZ,
  revoked_reason VARCHAR(40),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_revoked ON sessions(user_id, revoked_at);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- 2b. device_bindings
CREATE TABLE IF NOT EXISTS device_bindings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id     VARCHAR(120) NOT NULL,
  device_name   VARCHAR(120),
  platform      VARCHAR(20),
  app_version   VARCHAR(20),
  push_token    TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  trust_level   VARCHAR(20) NOT NULL DEFAULT 'NEW',
  revoked_at    TIMESTAMPTZ,
  CONSTRAINT uq_user_device UNIQUE (user_id, device_id)
);
CREATE INDEX IF NOT EXISTS idx_device_user_trust ON device_bindings(user_id, trust_level);

-- 2c. admin_totp
CREATE TABLE IF NOT EXISTS admin_totp (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret       TEXT NOT NULL,
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  backup_codes TEXT[] NOT NULL DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2d. admin_audit_log
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action      VARCHAR(80) NOT NULL,
  target_type VARCHAR(40),
  target_id   UUID,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_user ON admin_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action, created_at DESC);

-- 3. vendors
CREATE TABLE IF NOT EXISTS vendors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id),
  store_name     VARCHAR(150) NOT NULL,
  slug           CITEXT UNIQUE NOT NULL,
  cluster_zone   VARCHAR(50) NOT NULL,
  location       GEOGRAPHY(POINT, 4326) NOT NULL,
  address_text   TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  is_open        BOOLEAN NOT NULL DEFAULT FALSE,
  logo_url       TEXT,
  banner_url     TEXT,
  phone_number   VARCHAR(20),
  commission_bps SMALLINT NOT NULL DEFAULT 1500,
  bank_code      VARCHAR(10),
  account_number VARCHAR(20),
  account_name   VARCHAR(120),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ,
  CONSTRAINT chk_commission CHECK (commission_bps BETWEEN 0 AND 5000)
);

CREATE INDEX IF NOT EXISTS idx_vendors_cluster  ON vendors(cluster_zone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_location ON vendors USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_vendors_open     ON vendors(is_open, is_active) WHERE deleted_at IS NULL;

-- 4. products
CREATE TABLE IF NOT EXISTS products (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name           VARCHAR(150) NOT NULL,
  description    TEXT,
  price          NUMERIC(14,2) NOT NULL CHECK (price >= 0),
  is_available   BOOLEAN NOT NULL DEFAULT TRUE,
  is_published   BOOLEAN NOT NULL DEFAULT TRUE,
  image_url      TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  category       VARCHAR(60),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_products_vendor_avail ON products(vendor_id, is_available)
  WHERE deleted_at IS NULL AND is_published;

-- 5. orders
CREATE TABLE IF NOT EXISTS orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number       VARCHAR(20) UNIQUE NOT NULL,
  customer_id        UUID NOT NULL REFERENCES users(id),
  vendor_id          UUID NOT NULL REFERENCES vendors(id),
  status             order_status NOT NULL DEFAULT 'PENDING',
  subtotal           NUMERIC(14,2) NOT NULL CHECK (subtotal >= 0),
  delivery_fee       NUMERIC(14,2) NOT NULL CHECK (delivery_fee >= 0),
  platform_fee       NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount           NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount       NUMERIC(14,2) NOT NULL CHECK (total_amount >= 0),
  commission_bps     SMALLINT NOT NULL,
  payment_reference  VARCHAR(80) UNIQUE,
  payment_provider   VARCHAR(30),
  paid_at            TIMESTAMPTZ,
  delivery_address   TEXT NOT NULL,
  delivery_location  GEOGRAPHY(POINT, 4326),
  delivery_otp       VARCHAR(6),
  notes              TEXT,
  cancel_reason      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer  ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_vendor    ON orders(vendor_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders(status, created_at DESC);

-- 6. order_status_history
CREATE TABLE IF NOT EXISTS order_status_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status   order_status NOT NULL,
  actor_id    UUID REFERENCES users(id),
  note        TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_osh_order ON order_status_history(order_id, created_at);

-- 7. order_items
CREATE TABLE IF NOT EXISTS order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  vendor_id         UUID NOT NULL REFERENCES vendors(id),
  product_name      VARCHAR(150) NOT NULL,
  product_image_url TEXT,
  quantity          INTEGER NOT NULL CHECK (quantity > 0),
  unit_price        NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  line_total        NUMERIC(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 8. riders
CREATE TABLE IF NOT EXISTS riders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id),
  vehicle_type      VARCHAR(30) NOT NULL,
  vehicle_plate     VARCHAR(20),
  guarantor_name    VARCHAR(120),
  guarantor_phone   VARCHAR(20),
  current_cluster   VARCHAR(50),
  is_online         BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved       BOOLEAN NOT NULL DEFAULT FALSE,
  last_heartbeat_at TIMESTAMPTZ,
  last_location     GEOGRAPHY(POINT, 4326),
  rating_avg        NUMERIC(3,2) DEFAULT 5.00,
  total_deliveries  INTEGER NOT NULL DEFAULT 0,
  commission_bps    SMALLINT NOT NULL DEFAULT 2000,
  bank_code         VARCHAR(10),
  account_number    VARCHAR(20),
  account_name      VARCHAR(120),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_riders_online_cluster ON riders(current_cluster, is_online, is_approved)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_riders_location       ON riders USING GIST(last_location);

-- 9. deliveries
CREATE TABLE IF NOT EXISTS deliveries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL UNIQUE REFERENCES orders(id),
  rider_id          UUID REFERENCES riders(id),
  status            delivery_status NOT NULL DEFAULT 'LOOKING_FOR_RIDER',
  pickup_address    TEXT NOT NULL,
  pickup_location   GEOGRAPHY(POINT, 4326) NOT NULL,
  dropoff_address   TEXT NOT NULL,
  dropoff_location  GEOGRAPHY(POINT, 4326) NOT NULL,
  distance_meters   INTEGER,
  estimated_minutes INTEGER,
  offered_at        TIMESTAMPTZ,
  accepted_at       TIMESTAMPTZ,
  picked_up_at      TIMESTAMPTZ,
  delivered_at      TIMESTAMPTZ,
  failed_reason     TEXT,
  proof_image_url   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_rider  ON deliveries(rider_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status, offered_at);

-- 10. rider_dispatch_attempts
CREATE TABLE IF NOT EXISTS rider_dispatch_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id     UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  rider_id        UUID NOT NULL REFERENCES riders(id),
  offered_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at    TIMESTAMPTZ,
  response        dispatch_response NOT NULL DEFAULT 'OFFERED',
  distance_meters INTEGER,
  offer_round     SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT uq_attempt UNIQUE (delivery_id, rider_id, offer_round)
);

CREATE INDEX IF NOT EXISTS idx_rda_delivery ON rider_dispatch_attempts(delivery_id, offered_at);
CREATE INDEX IF NOT EXISTS idx_rda_rider    ON rider_dispatch_attempts(rider_id, response);

-- 11. wallets
CREATE TABLE IF NOT EXISTS wallets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     UUID REFERENCES users(id),
  ledger_type  wallet_type NOT NULL,
  currency     CHAR(3) NOT NULL DEFAULT 'NGN',
  balance      NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_locked    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_wallet_owner_type UNIQUE (owner_id, ledger_type, currency)
);

CREATE INDEX IF NOT EXISTS idx_wallets_owner ON wallets(owner_id);
CREATE INDEX IF NOT EXISTS idx_wallets_type  ON wallets(ledger_type);

-- 12. ledger_entries
CREATE TABLE IF NOT EXISTS ledger_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_group_id    UUID NOT NULL,
  wallet_id         UUID NOT NULL REFERENCES wallets(id),
  order_id          UUID REFERENCES orders(id),
  payout_id         UUID,
  account_code      VARCHAR(40) NOT NULL,
  amount            NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  direction         ledger_direction NOT NULL,
  currency          CHAR(3) NOT NULL DEFAULT 'NGN',
  description       VARCHAR(255) NOT NULL,
  idempotency_key   VARCHAR(120) NOT NULL,
  balance_after     NUMERIC(14,2),
  metadata          JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ledger_idempotency
  ON ledger_entries(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_ledger_wallet_time
  ON ledger_entries(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_group
  ON ledger_entries(entry_group_id);
CREATE INDEX IF NOT EXISTS idx_ledger_order
  ON ledger_entries(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_account
  ON ledger_entries(account_code, created_at DESC);

-- Double-entry balance trigger
CREATE OR REPLACE FUNCTION assert_ledger_group_balanced()
RETURNS TRIGGER AS $$
DECLARE
  net NUMERIC(14,2);
BEGIN
  SELECT COALESCE(SUM(
    CASE direction WHEN 'CREDIT' THEN amount ELSE -amount END
  ), 0)
  INTO net
  FROM ledger_entries
  WHERE entry_group_id = COALESCE(NEW.entry_group_id, OLD.entry_group_id);

  IF net <> 0 THEN
    RAISE EXCEPTION 'Ledger group % is unbalanced (net=%)',
      COALESCE(NEW.entry_group_id, OLD.entry_group_id), net;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_balanced ON ledger_entries;
CREATE CONSTRAINT TRIGGER trg_ledger_balanced
  AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION assert_ledger_group_balanced();

-- 13. payouts
CREATE TABLE IF NOT EXISTS payouts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id        UUID NOT NULL REFERENCES wallets(id),
  amount           NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  currency         CHAR(3) NOT NULL DEFAULT 'NGN',
  status           payout_status NOT NULL DEFAULT 'PENDING',
  provider         VARCHAR(30) NOT NULL,
  provider_ref     VARCHAR(120),
  bank_code        VARCHAR(10),
  account_number   VARCHAR(20),
  account_name     VARCHAR(120),
  failure_reason   TEXT,
  initiated_by     UUID REFERENCES users(id),
  initiated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at     TIMESTAMPTZ,
  paid_at          TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payouts_wallet ON payouts(wallet_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status, initiated_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payout_provider_ref
  ON payouts(provider, provider_ref) WHERE provider_ref IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE ledger_entries
    ADD CONSTRAINT fk_ledger_payout
    FOREIGN KEY (payout_id) REFERENCES payouts(id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 14. webhook_events
CREATE TABLE IF NOT EXISTS webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        VARCHAR(30) NOT NULL,
  event_id        VARCHAR(120) NOT NULL,
  event_type      VARCHAR(60) NOT NULL,
  payload         JSONB NOT NULL,
  signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at    TIMESTAMPTZ,
  process_error   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_webhook UNIQUE (provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_unprocessed
  ON webhook_events(provider, created_at)
  WHERE processed_at IS NULL;

-- 15. reviews
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL UNIQUE REFERENCES orders(id),
  customer_id   UUID NOT NULL REFERENCES users(id),
  vendor_id     UUID REFERENCES vendors(id),
  rider_id      UUID REFERENCES riders(id),
  vendor_rating SMALLINT CHECK (vendor_rating BETWEEN 1 AND 5),
  rider_rating  SMALLINT CHECK (rider_rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_vendor ON reviews(vendor_id) WHERE vendor_rating IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_rider  ON reviews(rider_id)  WHERE rider_rating IS NOT NULL;

-- 16. notifications_outbox
CREATE TABLE IF NOT EXISTS notifications_outbox (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel      notification_channel NOT NULL,
  recipient    VARCHAR(120) NOT NULL,
  template     VARCHAR(60) NOT NULL,
  payload      JSONB NOT NULL,
  status       notification_status NOT NULL DEFAULT 'PENDING',
  attempts     SMALLINT NOT NULL DEFAULT 0,
  last_error   TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending
  ON notifications_outbox(scheduled_at)
  WHERE status = 'PENDING';

-- ============================================================
-- 17. AI MODULE TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS prompts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key        VARCHAR(80) NOT NULL,
  version    INTEGER NOT NULL,
  model      VARCHAR(60) NOT NULL,
  template   TEXT NOT NULL,
  eval_score NUMERIC(4,3),
  is_active  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_prompt_key_version UNIQUE (key, version)
);

CREATE TABLE IF NOT EXISTS menu_extractions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  image_url         TEXT NOT NULL,
  image_sha256      VARCHAR(64) NOT NULL,
  status            VARCHAR(30) NOT NULL,
  detected_language VARCHAR(10),
  confidence        NUMERIC(4,3),
  raw_response      JSONB NOT NULL,
  vision_model      VARCHAR(60) NOT NULL,
  classifier_model  VARCHAR(60),
  confirmed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_extractions_vendor ON menu_extractions(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_extractions_sha ON menu_extractions(image_sha256);

CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel         VARCHAR(20) NOT NULL,
  external_id     VARCHAR(120) NOT NULL,
  user_id         UUID REFERENCES users(id),
  state           VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_conversation_channel_external UNIQUE (channel, external_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_state ON conversations(state, last_message_at DESC);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction       VARCHAR(3) NOT NULL,
  type            VARCHAR(20) NOT NULL,
  body            TEXT,
  media_url       TEXT,
  parsed_intent   JSONB,
  model_used      VARCHAR(60),
  confidence      NUMERIC(4,3),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_conv ON conversation_messages(conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS ai_call_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module     VARCHAR(40) NOT NULL,
  model      VARCHAR(60) NOT NULL,
  request_id VARCHAR(80) NOT NULL,
  entity_id  UUID,
  latency_ms INTEGER NOT NULL,
  tokens_in  INTEGER,
  tokens_out INTEGER,
  cost_ngn   NUMERIC(10,4),
  confidence NUMERIC(4,3),
  cache_hit  BOOLEAN NOT NULL DEFAULT FALSE,
  error_code VARCHAR(40),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_module ON ai_call_logs(module, created_at DESC);

CREATE TABLE IF NOT EXISTS support_tickets (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id),
  order_id           UUID REFERENCES orders(id),
  channel            VARCHAR(20) NOT NULL,
  status             VARCHAR(30) NOT NULL DEFAULT 'AI_TRIAGING',
  category           VARCHAR(40),
  sentiment          VARCHAR(20),
  urgency            VARCHAR(20),
  ai_resolution      JSONB,
  escalated_to_human BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);

CREATE TABLE IF NOT EXISTS support_ticket_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  direction   VARCHAR(3) NOT NULL,
  author_type VARCHAR(20) NOT NULL,
  author_id   UUID REFERENCES users(id),
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages ON support_ticket_messages(ticket_id, created_at ASC);

-- 18. Timestamp triggers
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_touch ON users;
CREATE TRIGGER trg_users_touch     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_vendors_touch ON vendors;
CREATE TRIGGER trg_vendors_touch   BEFORE UPDATE ON vendors   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_products_touch ON products;
CREATE TRIGGER trg_products_touch  BEFORE UPDATE ON products  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_orders_touch ON orders;
CREATE TRIGGER trg_orders_touch    BEFORE UPDATE ON orders    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_riders_touch ON riders;
CREATE TRIGGER trg_riders_touch    BEFORE UPDATE ON riders    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_deliveries_touch ON deliveries;
CREATE TRIGGER trg_deliveries_touch BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_wallets_touch ON wallets;
CREATE TRIGGER trg_wallets_touch   BEFORE UPDATE ON wallets   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_payouts_touch ON payouts;
CREATE TRIGGER trg_payouts_touch   BEFORE UPDATE ON payouts   FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
