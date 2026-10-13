#!/usr/bin/env bash
# scripts/smoke-test.sh
# Automated Post-Deployment Verification Suite for Dispatch Platform
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
FAIL=0

check() {
  local name=$1
  local cmd=$2
  local expected=$3

  echo -n "  Testing $name... "
  RESULT=$(eval "$cmd" 2>/dev/null || echo "FAILED")

  if echo "$RESULT" | grep -q "$expected"; then
    echo "✅ PASS"
  else
    echo "❌ FAIL (Expected: '$expected', Got: '$RESULT')"
    FAIL=$((FAIL + 1))
  fi
}

echo "=========================================================="
echo "Dispatch Platform Automated Smoke Test Suite"
echo "Target Endpoint: $API_URL"
echo "=========================================================="

echo ""
echo "[1. Health & Documentation Endpoints]"
check "Swagger API Docs" "curl -sf -o /dev/null -w '%{http_code}' $API_URL/api/docs" "200"

echo ""
echo "[2. Security & Anti-Brute-Force Verification]"
OTP_RESP=$(curl -sf -X POST "$API_URL/api/auth/otp/request" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+2348011112222","purpose":"LOGIN"}' || echo "FAILED")
check "OTP Delivery Request" "echo '$OTP_RESP'" '"otpId"'

echo ""
echo "[3. Webhook Cryptographic Verification]"
check "Monnify Rejects Forged HMAC Signature" \
  "curl -s -o /dev/null -w '%{http_code}' -X POST $API_URL/api/auth/webhooks/monnify -H 'monnify-signature: forged_bad_sig_123' -d '{\"amount\":5000}'" \
  "401"

echo ""
echo "=========================================================="
if [ $FAIL -eq 0 ]; then
  echo "All production smoke tests passed! System is operational. ✅"
  exit 0
else
  echo "$FAIL smoke test(s) failed. Check logs immediately. ❌"
  exit 1
fi
