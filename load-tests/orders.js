// load-tests/orders.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { CONFIG, generateUUID, getRandomCoordinates } from './config.js';

// Custom metrics aligned with Service Level Objectives
export const orderErrorRate = new Rate('order_placement_errors');
export const orderPlacementDuration = new Trend('order_placement_duration_ms', true);

// Load test options: Ramp-up to 100 orders/sec peak load
export const options = {
  scenarios: {
    peak_lunch_rush: {
      executor: 'ramping-arrival-rate',
      startRate: 10,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 250,
      stages: [
        { duration: '30s', target: 30 },  // Warm-up to 30 orders/sec
        { duration: '1m', target: 100 },  // Surge to 100 orders/sec peak
        { duration: '2m', target: 100 },  // Sustain 100 orders/sec
        { duration: '30s', target: 20 },  // Scale down
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1200'], // P95 latency under 500ms
    'order_placement_errors': ['rate<0.01'],            // Error rate under 1%
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const idempotencyKey = generateUUID();
  const coords = getRandomCoordinates('TANKE');
  
  // Construct randomized order payload with 1-3 items
  const itemCount = Math.floor(Math.random() * 3) + 1;
  const items = [];
  let subtotal = 0;

  for (let i = 0; i < itemCount; i++) {
    const item = CONFIG.sampleItems[Math.floor(Math.random() * CONFIG.sampleItems.length)];
    const quantity = Math.floor(Math.random() * 2) + 1;
    items.push({
      productId: `prod_${generateUUID().substring(0, 8)}`,
      name: item.name,
      unitPrice: item.price,
      quantity: quantity,
      subtotal: item.price * quantity,
    });
    subtotal += item.price * quantity;
  }

  const deliveryFee = 800;
  const platformFee = 100;
  const totalAmount = subtotal + deliveryFee + platformFee;

  const payload = JSON.stringify({
    vendorId: 'vendor_tanke_kitchen_01',
    customerPhone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
    deliveryAddress: {
      street: 'Tanke University Road, Near PS Gate',
      clusterZone: 'TANKE',
      latitude: coords.latitude,
      longitude: coords.longitude,
    },
    items: items,
    financials: {
      subtotalAmount: subtotal,
      deliveryFee: deliveryFee,
      platformFee: platformFee,
      totalAmount: totalAmount,
    },
    paymentMethod: 'BANK_TRANSFER',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.authToken}`,
      'X-Idempotency-Key': idempotencyKey,
    },
    tags: { name: 'POST_orders_create' },
    timeout: '5s',
  };

  const startTime = Date.now();
  const res = http.post(`${CONFIG.baseUrl}/orders`, payload, params);
  const duration = Date.now() - startTime;
  orderPlacementDuration.add(duration);

  const success = check(res, {
    'status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'order has orderNumber': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body && (body.orderNumber || body.id);
      } catch (_) {
        return false;
      }
    },
    'latency under 1s': () => duration < 1000,
  });

  orderErrorRate.add(!success);

  // Think time between customer browsing actions
  sleep(Math.random() * 0.5 + 0.1);
}
