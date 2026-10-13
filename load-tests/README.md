# ⚡ Load Testing Suite (k6)

This directory contains executable [k6](https://k6.io/) stress tests simulating realistic peak traffic patterns for the **Dispatch Rider Aggregator & Food Vendor Storefront** platform in secondary Nigerian cities (Ilorin, Kwara State).

## Test Scenarios

| Script | Traffic Pattern | Target Endpoint | Performance SLO Threshold |
| :--- | :--- | :--- | :--- |
| **`orders.js`** | Ramping arrival rate: 10 $\rightarrow$ 100 orders/sec | `POST /orders` | P95 $< 500\text{ms}$, Error Rate $< 1.0\%$ |
| **`dispatch.js`** | 50 concurrent VUs racing for offers | `POST /dispatch/candidates`<br>`POST /dispatch/offers/:id/accept` | P95 $< 300\text{ms}$, 1 winner / atomic 409 conflict |
| **`rider-telemetry.js`** | 500 concurrent continuous GPS streams | `POST /riders/me/location` | P95 $< 120\text{ms}$, Error Rate $< 0.5\%$ |

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Debian / Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
```

## Running the Suite

```bash
# Run against local dev server (default: http://localhost:3000)
chmod +x load-tests/run-all.sh
./load-tests/run-all.sh local

# Run against staging environment
./load-tests/run-all.sh staging

# Run against production environment
./load-tests/run-all.sh prod
```

Or run individual scenarios:
```bash
k6 run --env API_BASE_URL="http://localhost:3000" load-tests/orders.js
k6 run --env API_BASE_URL="http://localhost:3000" load-tests/dispatch.js
k6 run --env API_BASE_URL="http://localhost:3000" load-tests/rider-telemetry.js
```
