import { Injectable, Logger, Optional } from '@nestjs/common';
import { Candidate } from './candidate-query.service';
import { AiClientService } from '../ai/ai-client.service';

export interface ScoredCandidate extends Candidate {
  score: number;
  scoreBreakdown: Record<string, number>;
}

export interface ScorerContext {
  deliveryId: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}

/**
 * Scoring model (weights sum to 1.0):
 *   proximity       0.40  — closer riders win
 *   idle_time       0.20  — fairer distribution
 *   acceptance_rate 0.20  — reliable riders first
 *   rating          0.10  — quality signal
 *   ai_match_score  0.10  — Vertex AI rider-match model (optional)
 */
@Injectable()
export class DispatchScorer {
  private readonly logger = new Logger(DispatchScorer.name);

  constructor(@Optional() private readonly aiClient?: AiClientService) {}

  async scoreCandidates(
    candidates: Candidate[],
    ctx: ScorerContext,
  ): Promise<ScoredCandidate[]> {
    if (candidates.length === 0) return [];

    const now = Date.now();
    const maxDistance = Math.max(...candidates.map((c) => c.distanceMeters), 1);

    // Call Vertex AI Rider Match Scorer if available
    let aiScoreMap = new Map<string, number>();
    if (this.aiClient) {
      try {
        const res = await this.aiClient.scoreRiderMatch({
          deliveryId: ctx.deliveryId,
          pickup: { lat: ctx.pickupLat, lng: ctx.pickupLng },
          dropoff: { lat: ctx.dropoffLat, lng: ctx.dropoffLng },
          riders: candidates.map((c) => ({
            riderId: c.riderId,
            distanceMeters: c.distanceMeters,
            cluster: c.cluster,
            ratingAvg: c.ratingAvg,
            acceptanceRate30d: c.acceptanceRate30d,
          })),
        });
        aiScoreMap = new Map(res.scores.map((s) => [s.riderId, s.score]));
      } catch (err) {
        this.logger.debug(`AiClient scoreRiderMatch fallback: ${(err as Error).message}`);
      }
    }

    const scored = candidates.map<ScoredCandidate>((c) => {
      const proximityScore = 1 - c.distanceMeters / maxDistance;
      const idleMinutes = c.lastOfferAt
        ? (now - c.lastOfferAt.getTime()) / 60_000
        : 60;
      const idleScore = Math.min(idleMinutes / 30, 1);
      const acceptScore = c.acceptanceRate30d;
      const ratingScore = (c.ratingAvg - 3) / 2;
      const aiScore = aiScoreMap.get(c.riderId) ?? 0.5;

      const breakdown = {
        proximity: 0.40 * proximityScore,
        idle: 0.20 * idleScore,
        acceptance: 0.20 * acceptScore,
        rating: 0.10 * Math.max(0, ratingScore),
        ai: 0.10 * aiScore,
      };

      const score =
        breakdown.proximity +
        breakdown.idle +
        breakdown.acceptance +
        breakdown.rating +
        breakdown.ai;

      return { ...c, score, scoreBreakdown: breakdown };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
  }
}
