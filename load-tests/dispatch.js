// load-tests/dispatch.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { CONFIG, generateUUID, getRandomCoordinates } from './config.js';

export const lockContentionRate = new Rate('lock_contention_rate');
export const matchDuration = new Trend('dispatch_match_duration_ms', true);
export const offerAcceptDuration = new Trend('offer_accept_duration_ms', true);
export const acceptedOffers = new Counter('successful_offer_accepts');
export const rejectedRaces = new Counter('rejected_offer_races');

export const options = {
  scenarios: {
    // Scenario 1: High concurrency candidate scoring
    candidate_matching: {
      executor: 'constant-vus',
      vus: 20,
      duration: '1m',
    },
    // Scenario 2: Concurrent offer claiming race
    offer_claim_racing: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '20s', target: 0 },
      ],
    },
  },
  thresholds: {
    'dispatch_match_duration_ms': ['p(95)<300', 'p(99)<600'],
    'offer_accept_duration_ms': ['p(95)<250'],
    'http_req_failed': ['rate<0.05'], // Max 5% 5xx errors; 409 Conflict is expected in race
  },
};

export default function () {
  const vuId = __VU;
  const riderId = `rider_ilorin_${vuId}`;
  const cluster = 'TANKE';
  const pickup = getRandomCoordinates(cluster);

  // 1. Stress test: Candidate matching query
  const matchPayload = JSON.stringify({
    pickupLat: pickup.latitude,
    pickupLng: pickup.longitude,
    clusterZone: cluster,
    radiusMeters: 5000,
    requiredCapacityKg: 10,
  });

  const matchHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CONFIG.authToken}`,
  };

  const startMatch = Date.now();
  const matchRes = http.post(
    `${CONFIG.baseUrl}/dispatch/candidates`,
    matchPayload,
    { headers: matchHeaders, tags: { name: 'POST_dispatch_candidates' } },
  );
  matchDuration.add(Date.now() - startMatch);

  check(matchRes, {
    'match query status 200': (r) => r.status === 200 || r.status === 201,
  });

  // 2. Stress test: Offer Claim Race Condition
  // Virtual users race to accept offers from a shared set of offer IDs
  const sharedOfferId = `offer_batch_${Math.floor(__ITER / 10)}`;

  const acceptPayload = JSON.stringify({
    offerId: sharedOfferId,
    riderId: riderId,
    acceptedAt: new Date().toISOString(),
  });

  const acceptHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${CONFIG.authToken}`,
    'X-Rider-Id': riderId,
  };

  const startAccept = Date.now();
  const acceptRes = http.post(
    `${CONFIG.baseUrl}/dispatch/offers/${sharedOfferId}/accept`,
    acceptPayload,
    { headers: acceptHeaders, tags: { name: 'POST_dispatch_offer_accept' } },
  );
  offerAcceptDuration.add(Date.now() - startAccept);

  // In a distributed race condition:
  // Exactly ONE rider gets 200 OK
  // All other concurrent riders must receive 409 Conflict or 400 with 'OFFER_ALREADY_CLAIMED'
  if (acceptRes.status === 200 || acceptRes.status === 201) {
    acceptedOffers.add(1);
    lockContentionRate.add(0);
  } else if (acceptRes.status === 409 || acceptRes.status === 400) {
    rejectedRaces.add(1);
    lockContentionRate.add(1);
  }

  check(acceptRes, {
    'atomic lock: status is either 200 or 409 conflict': (r) =>
      r.status === 200 || r.status === 201 || r.status === 409 || r.status === 400,
    'no internal server error 500': (r) => r.status !== 500,
  });

  sleep(Math.random() * 0.4 + 0.1);
}
