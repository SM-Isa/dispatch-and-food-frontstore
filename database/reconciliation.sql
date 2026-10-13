-- ============================================================================
-- Dispatch Rider Aggregator & Food Vendor Storefront
-- Nightly Reconciliation Job & Data Integrity Audit
-- (All queries should return ZERO rows. Any row is a data-integrity incident)
-- ============================================================================

-- Audit 1: Wallet Balance Discrepancy Audit
-- Detects if any cached wallet balance diverged from the immutable ledger entries.
SELECT 
  w.id AS wallet_id,
  w.owner_id,
  w.ledger_type,
  w.balance AS cached_balance,
  COALESCE(SUM(
    CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END
  ), 0) AS computed_balance,
  w.balance - COALESCE(SUM(
    CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END
  ), 0) AS variance
FROM wallets w
LEFT JOIN ledger_entries le ON le.wallet_id = w.id
GROUP BY w.id, w.owner_id, w.ledger_type, w.balance
HAVING w.balance <> COALESCE(SUM(
  CASE le.direction WHEN 'CREDIT' THEN le.amount ELSE -le.amount END
), 0);

-- Audit 2: Unbalanced Double-Entry Groups
-- Asserts that for every entry_group_id, sum(credits) == sum(debits) [net == 0].
SELECT 
  entry_group_id, 
  COUNT(*) AS entry_count,
  SUM(CASE direction WHEN 'CREDIT' THEN amount ELSE -amount END) AS net_imbalance
FROM ledger_entries
GROUP BY entry_group_id
HAVING SUM(CASE direction WHEN 'CREDIT' THEN amount ELSE -amount END) <> 0;

-- Audit 3: Stale Rider Heartbeat Audit (Ghost Riders)
-- Identifies riders marked online without a heartbeat ping in the last 10 minutes.
SELECT 
  r.id AS rider_id,
  r.user_id,
  u.phone_number,
  r.current_cluster,
  r.last_heartbeat_at,
  NOW() - r.last_heartbeat_at AS silent_duration
FROM riders r
JOIN users u ON u.id = r.user_id
WHERE r.is_online = true 
  AND (r.last_heartbeat_at IS NULL OR r.last_heartbeat_at < NOW() - INTERVAL '10 minutes');

-- Audit 4: Stuck In-Flight Escrows (Orders completed but escrow unreleased)
SELECT 
  o.id AS order_id,
  o.order_number,
  o.status,
  o.total_amount,
  o.created_at
FROM orders o
WHERE o.status = 'COMPLETED'
  AND NOT EXISTS (
    SELECT 1 FROM ledger_entries le 
    WHERE le.order_id = o.id 
      AND le.account_code = '2000_VENDOR_PAYABLE'
  );
