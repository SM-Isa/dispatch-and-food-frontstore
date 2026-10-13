import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { RiderPresenceService } from '../riders/rider-presence.service';

export type DispatchRound = 1 | 2 | 3 | 4 | 5;

export interface Candidate {
  riderId: string;
  distanceMeters: number;
  cluster: string;
  ratingAvg: number;
  acceptanceRate30d: number;
  lastOfferAt: Date | null;
}

export interface CandidateQueryInput {
  deliveryId: string;
  cluster: string;
  lat: number;
  lng: number;
  round: DispatchRound;
  excludeRiderIds: string[];
  limit: number;
}

@Injectable()
export class CandidateQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: RiderPresenceService,
  ) {}

  async findCandidates(input: CandidateQueryInput): Promise<Candidate[]> {
    const { radius, clusterScope } = this.radiusForRound(input.round);

    // 1. Geo query → rider IDs within radius from Redis
    const nearby = await this.presence.findRidersWithinRadius(
      input.lat,
      input.lng,
      radius,
      input.limit * 3,
    );

    if (nearby.length === 0) return [];

    const riderIds = nearby
      .map((r) => r.riderId)
      .filter((id) => !input.excludeRiderIds.includes(id));

    if (riderIds.length === 0) return [];

    // 2. DB filter: isApproved, cluster scope, not deleted
    const clusterFilter =
      clusterScope === 'same'
        ? { currentCluster: input.cluster }
        : clusterScope === 'adjacent'
          ? { currentCluster: { in: await this.adjacentClusters(input.cluster) } }
          : {};

    const riders = await this.prisma.rider.findMany({
      where: {
        id: { in: riderIds },
        isApproved: true,
        isOnline: true,
        deletedAt: null,
        ...clusterFilter,
      },
      select: {
        id: true,
        currentCluster: true,
        ratingAvg: true,
      },
    });

    if (riders.length === 0) return [];

    // 3. Enrich with historical stats
    const riderMap = new Map(riders.map((r) => [r.id, r]));
    const enriched: Candidate[] = [];

    for (const { riderId, distanceMeters } of nearby) {
      const rider = riderMap.get(riderId);
      if (!rider) continue;

      enriched.push({
        riderId,
        distanceMeters,
        cluster: rider.currentCluster ?? 'UNKNOWN',
        ratingAvg: Number(rider.ratingAvg),
        acceptanceRate30d: await this.acceptanceRate(riderId),
        lastOfferAt: await this.lastOfferAt(riderId),
      });
    }

    return enriched;
  }

  private radiusForRound(round: DispatchRound): {
    radius: number;
    clusterScope: 'same' | 'adjacent' | 'any';
  } {
    switch (round) {
      case 1:
        return { radius: 2000, clusterScope: 'same' };
      case 2:
        return { radius: 3000, clusterScope: 'same' };
      case 3:
        return { radius: 4000, clusterScope: 'adjacent' };
      case 4:
        return { radius: 5000, clusterScope: 'any' };
      default:
        return { radius: 5000, clusterScope: 'any' };
    }
  }

  private async adjacentClusters(cluster: string): Promise<string[]> {
    const ADJACENCY: Record<string, string[]> = {
      TANKE: ['GRA', 'FATE'],
      GRA: ['TANKE', 'CHALLENGE'],
      CHALLENGE: ['GRA', 'FATE'],
      FATE: ['TANKE', 'CHALLENGE'],
    };
    return ADJACENCY[cluster] ?? [];
  }

  private async acceptanceRate(riderId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<Array<{ rate: number }>>`
      SELECT
        CASE WHEN COUNT(*) = 0 THEN 0.8
             ELSE COUNT(*) FILTER (WHERE response = 'ACCEPTED')::float / COUNT(*)
        END AS rate
      FROM rider_dispatch_attempts
      WHERE rider_id = ${riderId}::uuid
        AND offered_at > now() - interval '30 days'
    `;
    return rows[0]?.rate ?? 0.8;
  }

  private async lastOfferAt(riderId: string): Promise<Date | null> {
    const row = await this.prisma.riderDispatchAttempt.findFirst({
      where: { riderId },
      orderBy: { offeredAt: 'desc' },
      select: { offeredAt: true },
    });
    return row?.offeredAt ?? null;
  }
}
