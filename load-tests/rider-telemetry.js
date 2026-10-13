// load-tests/rider-telemetry.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { CONFIG, getRandomCoordinates } from './config.js';

export const telemetryErrorRate = new Rate('telemetry_error_rate');
export const telemetryLatency = new Trend('telemetry_latency_ms', true);

export const options = {
  scenarios: {
    // 500 concurrent riders sending location telemetry continuously
    fleet_telemetry_stream: {
      executor: 'ramping-vus',
      startVUs: 50,
      stages: [
        { duration: '30s', target: 200 },  // Ramp to 200 riders
        { duration: '1m', target: 500 },   // Surge to 500 active riders
        { duration: '2m', target: 500 },   // Maintain 500 concurrent riders
        { duration: '30s', target: 100 },  // Wind down
        { duration: '10s', target: 0 },
      ],
    },
  },
  thresholds: {
    'telemetry_latency_ms': ['p(95)<120', 'p(99)<300'], // Redis GEOADD P95 should be < 120ms
    'telemetry_error_rate': ['rate<0.005'],              // Error rate under 0.5%
    'http_req_failed': ['rate<0.005'],
  },
};

export default function () {
  const riderIndex = __VU;
  const clusters = ['TANKE', 'GRA', 'FATE', 'CHALLENGE'];
  const cluster = clusters[riderIndex % clusters.length];
  const coords = getRandomCoordinates(cluster);

  const payload = JSON.stringify({
    latitude: coords.latitude,
    longitude: coords.longitude,
    clusterZone: cluster,
    accuracyMeters: 4.5,
    speedKmh: Math.floor(Math.random() * 45) + 5,
    headingDegrees: Math.floor(Math.random() * 360),
    batteryPercentage: Math.max(15, 100 - Math.floor(__ITER / 10)),
    timestamp: new Date().toISOString(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.authToken}`,
      'X-Rider-Id': `rider_${riderIndex}`,
    },
    tags: { name: 'POST_riders_location_heartbeat' },
    timeout: '3s',
  };

  const startTime = Date.now();
  const res = http.post(`${CONFIG.baseUrl}/riders/me/location`, payload, params);
  const latency = Date.now() - startTime;
  telemetryLatency.add(latency);

  const success = check(res, {
    'telemetry accepted (200 or 204)': (r) => r.status === 200 || r.status === 204,
    'sub-200ms latency': () => latency < 200,
  });

  telemetryErrorRate.add(!success);

  // In production, mobile rider client emits heartbeat every 2-3 seconds
  sleep(2.0 + Math.random() * 1.0);
}
