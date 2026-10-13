#!/usr/bin/env bash
# scripts/test-actors-flow.sh
# End-to-End Multi-Actor Local Lifecycle Verification Runner
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "======================================================================"
echo "  Dispatch Multi-Actor Local Verification Suite"
echo "  Testing: Customer -> PSP Webhook -> Vendor -> Rider -> Admin Ledger"
echo "======================================================================"

cd "$PROJECT_ROOT"

echo ""
echo "[Step 1/3] Validating Monorepo Workspaces & Prisma Schema..."
npm --prefix backend run prisma:generate >/dev/null 2>&1
echo "  ✅ Prisma client generated and relation types verified."

echo ""
echo "[Step 2/3] Executing Multi-Actor Lifecycle E2E Test Suite..."
npm run test:e2e:lifecycle

echo ""
echo "[Step 3/3] Executing Full Comprehensive Concurrency & Security Suite..."
npm run test:e2e

echo ""
echo "======================================================================"
echo "  🎉 All Multi-Actor Local Testing Passed Successfully!"
echo "  The system is verified across all 4 actors before cloud deployment."
echo "======================================================================"
