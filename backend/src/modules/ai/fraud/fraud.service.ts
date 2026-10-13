import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AiClientService } from '../ai-client.service';

export interface FraudScoreResult {
  entityId: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: 'ALLOW' | 'CHALLENGE' | 'MANUAL_REVIEW' | 'BLOCK';
  topFeatures: Array<{ feature: string; contribution: number }>;
  modelVersion: string;
  evaluatedAt: string;
}

export interface ReviewQueueItem {
  id: string;
  orderId: string;
  userId?: string;
  amount: number;
  riskScore: number;
  riskLevel: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  // In-memory review queue for flagged high-risk items (backed by Redis/DB in prod)
  private readonly reviewQueue: Map<string, ReviewQueueItem> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiClient: AiClientService,
  ) {}

  /**
   * Score fraud risk for an order before payment capture or food prep
   */
  async scoreOrder(orderId: string): Promise<FraudScoreResult> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Extract signals
    const customer = order.customer;
    let accountAgeDays = 30;
    if (customer?.createdAt) {
      accountAgeDays = Math.max(
        0,
        Math.floor((Date.now() - customer.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      );
    }

    // Historical orders in last 24h
    const ordersLast24h = customer
      ? await this.prisma.order.count({
          where: {
            customerId: customer.id,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        })
      : 1;

    // Refund rate
    const totalOrders = customer
      ? await this.prisma.order.count({ where: { customerId: customer.id } })
      : 1;
    const refundedOrders = customer
      ? await this.prisma.order.count({
          where: { customerId: customer.id, status: 'REFUNDED' },
        })
      : 0;
    const refundRate = totalOrders > 0 ? refundedOrders / totalOrders : 0;

    // Cancellations
    const cancellations = customer
      ? await this.prisma.order.count({
          where: {
            customerId: customer.id,
            status: 'CANCELLED',
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        })
      : 0;

    // AI Scoring Call
    const aiResponse = await this.aiClient.scoreFraudRisk({
      account_age_days: accountAgeDays,
      orders_last_24h: ordersLast24h,
      refund_rate: refundRate,
      cancellations_last_7d: cancellations,
    });

    const result: FraudScoreResult = {
      entityId: orderId,
      riskScore: aiResponse.risk_score,
      riskLevel: aiResponse.risk_level as any,
      recommendedAction: aiResponse.recommended_action as any,
      topFeatures: aiResponse.top_features,
      modelVersion: aiResponse.model_version,
      evaluatedAt: aiResponse.scored_at,
    };

    // If High or Critical risk, enqueue for Admin review
    if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL') {
      const queueId = `rev_${orderId.slice(0, 8)}_${Date.now()}`;
      this.reviewQueue.set(queueId, {
        id: queueId,
        orderId,
        userId: customer?.id,
        amount: Number(order.totalAmount),
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        reason: result.topFeatures.map((f) => `${f.feature} (${f.contribution})`).join(', ') || 'High composite anomaly score',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      });
      this.logger.warn(`Order ${orderId} flagged for fraud review: Risk ${result.riskScore}`);
    }

    return result;
  }

  /**
   * Admin review queue
   */
  async getReviewQueue(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const all = Array.from(this.reviewQueue.values());
    if (status) {
      return all.filter((item) => item.status === status);
    }
    return all.sort((a, b) => (b.riskScore - a.riskScore));
  }

  /**
   * Resolve an item in review queue
   */
  async resolveReviewQueueItem(
    reviewId: string,
    decision: 'APPROVED' | 'REJECTED',
    notes: string,
  ) {
    const item = this.reviewQueue.get(reviewId);
    if (!item) {
      throw new NotFoundException(`Review item ${reviewId} not found`);
    }

    item.status = decision;
    this.reviewQueue.set(reviewId, item);

    this.logger.log(`Fraud review ${reviewId} resolved as ${decision}. Notes: ${notes}`);

    return {
      success: true,
      reviewId,
      decision,
      notes,
      orderId: item.orderId,
    };
  }
}
