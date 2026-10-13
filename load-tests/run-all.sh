#!/usr/bin/env bash
# load-tests/run-all.sh
# Automated execution runner for k6 load test suite

set -euo pipefail

TARGET_ENV="${1:-local}"
BASE_URL="http://localhost:3000"

if [ "$TARGET_ENV" = "staging" ]; then
  BASE_URL="https://staging-api.dispatch.ng"
elif [ "$TARGET_ENV" = "prod" ]; then
  BASE_URL="https://api.dispatch.ng"
fi

echo "=========================================================="
echo " Starting Dispatch & Food Storefront Load Test Suite"
echo " Target Environment : $TARGET_ENV"
echo " Base URL           : $BASE_URL"
echo " Timestamp          : $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=========================================================="

command -v k6 >/dev/null 2>&1 || {
  echo "Error: k6 is not installed. Install via 'brew install k6' or visit https://k6.io" >&2
  exit 1
}

export API_BASE_URL="$BASE_URL"

echo ""
echo ">>> [1/3] Running Order Placement Stress Test (100 orders/sec)..."
k6 run --env API_BASE_URL="$BASE_URL" load-tests/orders.js

echo ""
echo ">>> [2/3] Running Dispatch Candidate Matching & Lock Race Test..."
k6 run --env API_BASE_URL="$BASE_URL" load-tests/dispatch.js

echo ""
echo ">>> [3/3] Running Fleet Rider Telemetry Stream (500 Concurrent Riders)..."
k6 run --env API_BASE_URL="$BASE_URL" load-tests/rider-telemetry.js

echo ""
echo "=========================================================="
echo " All Load Test Scenarios Completed Successfully"
echo "=========================================================="
