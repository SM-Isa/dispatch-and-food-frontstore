// src/modules/dispatch/dispatch-lock.e2e-spec.ts
import { OfferLockService } from './offer-lock.service';

describe('Dispatch — Distributed Lock Racing E2E Tests', () => {
  let offerLockService: OfferLockService;
  let inMemoryRedis: Map<string, { value: string; expiresAt?: number }>;

  beforeEach(() => {
    inMemoryRedis = new Map();

    // Mock RedisService with atomic SET NX behavior matching Redis 7.0
    const mockRedisClient = {
      set: jest.fn(async (key: string, value: string, ...args: any[]) => {
        const isNX = args.includes('NX');
        const exIdx = args.indexOf('EX');
        const ttlSec = exIdx !== -1 ? args[exIdx + 1] : undefined;

        if (isNX && inMemoryRedis.has(key)) {
          // Key already exists — SET NX fails in Redis
          return null;
        }

        inMemoryRedis.set(key, {
          value,
          expiresAt: ttlSec ? Date.now() + ttlSec * 1000 : undefined,
        });
        return 'OK';
      }),
      get: jest.fn(async (key: string) => {
        const item = inMemoryRedis.get(key);
        if (!item) return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
          inMemoryRedis.delete(key);
          return null;
        }
        return item.value;
      }),
      exists: jest.fn(async (key: string) => {
        return inMemoryRedis.has(key) ? 1 : 0;
      }),
      del: jest.fn(async (...keys: string[]) => {
        let count = 0;
        for (const k of keys) {
          if (inMemoryRedis.delete(k)) count++;
        }
        return count;
      }),
    };

    const mockRedisService = {
      getClient: () => mockRedisClient,
    } as any;

    offerLockService = new OfferLockService(mockRedisService);
  });

  describe('Single-Winner Offer Claiming Semantics', () => {
    it('allows the first rider to claim an open offer', async () => {
      const offerId = 'offer_test_1001';
      const riderId = 'rider_musa_01';

      await offerLockService.initializeOffer(offerId, riderId, 60);
      expect(await offerLockService.isOfferLive(offerId)).toBe(true);

      const claimed = await offerLockService.claimOffer(offerId, riderId);
      expect(claimed).toBe(true);

      const winner = await offerLockService.getWinner(offerId);
      expect(winner).toBe(riderId);
    });

    it('rejects subsequent claims once an offer is locked', async () => {
      const offerId = 'offer_test_1002';
      const firstRider = 'rider_ibrahim_01';
      const secondRider = 'rider_taiwo_02';

      const firstClaim = await offerLockService.claimOffer(offerId, firstRider);
      expect(firstClaim).toBe(true);

      const secondClaim = await offerLockService.claimOffer(offerId, secondRider);
      expect(secondClaim).toBe(false);

      // Winner must remain the first rider
      const winner = await offerLockService.getWinner(offerId);
      expect(winner).toBe(firstRider);
    });

    it('resolves concurrent race condition with exactly ONE winner among 10 simultaneous riders', async () => {
      const offerId = 'offer_surge_lunch_rush_555';
      const candidateRiders = Array.from({ length: 10 }).map(
        (_, i) => `rider_candidate_${i}`,
      );

      // Execute all 10 claim attempts simultaneously using Promise.all
      const claimPromises = candidateRiders.map((riderId) =>
        offerLockService.claimOffer(offerId, riderId),
      );

      const results = await Promise.all(claimPromises);

      // Assert that exactly ONE rider received true (winner)
      const winnersCount = results.filter((won) => won === true).length;
      const losersCount = results.filter((won) => won === false).length;

      expect(winnersCount).toBe(1);
      expect(losersCount).toBe(9);

      // Verify the designated winner in Redis matches one of the candidates
      const officialWinner = await offerLockService.getWinner(offerId);
      expect(officialWinner).not.toBeNull();
      expect(candidateRiders).toContain(officialWinner);

      // Verify the winning index in the results array
      const winningIndex = candidateRiders.indexOf(officialWinner!);
      expect(results[winningIndex]).toBe(true);
    });

    it('cleans up lock and status keys upon cancellation', async () => {
      const offerId = 'offer_to_cancel_999';
      const riderId = 'rider_standby_77';

      await offerLockService.initializeOffer(offerId, riderId, 60);
      await offerLockService.claimOffer(offerId, riderId);

      expect(await offerLockService.isOfferLive(offerId)).toBe(true);
      expect(await offerLockService.getWinner(offerId)).toBe(riderId);

      await offerLockService.cancelOffer(offerId);

      expect(await offerLockService.isOfferLive(offerId)).toBe(false);
      expect(await offerLockService.getWinner(offerId)).toBeNull();
    });
  });
});
