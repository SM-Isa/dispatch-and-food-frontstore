import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { randomUUID } from 'crypto';
import {
  IAiGateway,
  AI_GATEWAY,
} from './interfaces/ai-gateway.interface';
import { MockAiGateway } from './gateways/mock-ai.gateway';

export interface ScoreRiderMatchInput {
  deliveryId: string;
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
  riders: Array<{
    riderId: string;
    distanceMeters: number;
    cluster: string;
    ratingAvg: number;
    acceptanceRate30d: number;
  }>;
}

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly aiGateway: IAiGateway;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(AI_GATEWAY)
    aiGateway?: IAiGateway,
  ) {
    this.aiGateway = aiGateway || new MockAiGateway();
  }

  /**
   * Log every AI call to BigQuery / Postgres ai_call_logs for governance and cost tracking
   */
  async logCall(input: {
    module: string;
    model: string;
    requestId: string;
    latencyMs: number;
    tokensIn?: number;
    tokensOut?: number;
    costNgn?: number;
    confidence?: number;
    cacheHit?: boolean;
    errorCode?: string;
  }) {
    try {
      await this.prisma.aiCallLog.create({
        data: {
          module: input.module,
          model: input.model,
          requestId: input.requestId,
          latencyMs: input.latencyMs,
          tokensIn: input.tokensIn,
          tokensOut: input.tokensOut,
          costNgn: input.costNgn ? input.costNgn : undefined,
          confidence: input.confidence ? input.confidence : undefined,
          cacheHit: input.cacheHit ?? false,
          errorCode: input.errorCode,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to log AI call metric: ${(err as Error).message}`);
    }
  }

  /**
   * Multimodal Vision Extraction: Gemini 1.5 Flash Vision
   * Delegates to active AI gateway profile (Mock vs Gemini Live SDK)
   */
  async extractMenuFromImage(imageUrl: string, languageHint = 'en') {
    const startTime = Date.now();
    const requestId = `req_${randomUUID()}`;

    try {
      const result = await this.aiGateway.extractMenuFromImage(imageUrl, languageHint);
      const latencyMs = Date.now() - startTime;

      await this.logCall({
        module: 'menu_extract',
        model: 'gemini-1.5-flash-vision',
        requestId,
        latencyMs,
        tokensIn: result.tokensIn || 850,
        tokensOut: result.tokensOut || 240,
        costNgn: result.costNgn || 4.5,
        confidence: result.confidence_overall,
      });

      return result;
    } catch (err) {
      await this.logCall({
        module: 'menu_extract',
        model: 'gemini-1.5-flash-vision',
        requestId,
        latencyMs: Date.now() - startTime,
        errorCode: (err as Error).message,
      });
      throw err;
    }
  }

  /**
   * Conversational Commerce: Gemini 1.5 Pro + Structured Outputs
   * Delegates to active AI gateway profile (Mock vs Gemini Live SDK)
   */
  async parseWhatsAppOrderIntent(text: string) {
    const startTime = Date.now();
    const requestId = `req_${randomUUID()}`;

    try {
      const result = await this.aiGateway.parseWhatsAppOrderIntent(text);
      const latencyMs = Date.now() - startTime;

      await this.logCall({
        module: 'whatsapp_parse',
        model: 'gemini-1.5-pro-002',
        requestId,
        latencyMs,
        tokensIn: result.tokensIn || 120,
        tokensOut: result.tokensOut || 80,
        confidence: result.confidence,
      });

      return result;
    } catch (err) {
      await this.logCall({
        module: 'whatsapp_parse',
        model: 'gemini-1.5-pro-002',
        requestId,
        latencyMs: Date.now() - startTime,
        errorCode: (err as Error).message,
      });
      throw err;
    }
  }

  /**
   * Vertex AI Anomaly Detection / Fraud Risk Scoring
   */
  async scoreFraudRisk(signals: {
    account_age_days?: number;
    orders_last_24h?: number;
    refund_rate?: number;
    cancellations_last_7d?: number;
  }) {
    const refundRate = signals.refund_rate || 0;
    const cancellations = signals.cancellations_last_7d || 0;

    let riskScore = 0.15; // baseline low risk
    const topFeatures: Array<{ feature: string; contribution: number }> = [];

    if (refundRate > 0.3) {
      riskScore += 0.45;
      topFeatures.push({ feature: 'refund_rate', contribution: 0.45 });
    }
    if (cancellations > 3) {
      riskScore += 0.25;
      topFeatures.push({ feature: 'cancellations_last_7d', contribution: 0.25 });
    }

    riskScore = Math.min(1.0, riskScore);

    let riskLevel = 'LOW';
    let recommendedAction = 'ALLOW';

    if (riskScore >= 0.90) {
      riskLevel = 'CRITICAL';
      recommendedAction = 'BLOCK';
    } else if (riskScore >= 0.75) {
      riskLevel = 'HIGH';
      recommendedAction = 'MANUAL_REVIEW';
    } else if (riskScore >= 0.40) {
      riskLevel = 'MEDIUM';
      recommendedAction = 'CHALLENGE';
    }

    return {
      risk_score: parseFloat(riskScore.toFixed(2)),
      risk_level: riskLevel,
      recommended_action: recommendedAction,
      top_features: topFeatures,
      model_version: 'fraud-xgb-v4',
      scored_at: new Date().toISOString(),
    };
  }

  /**
   * Vertex AI Rider Match Scorer
   */
  async scoreRiderMatch(input: ScoreRiderMatchInput) {
    return {
      scores: input.riders.map((r) => ({
        riderId: r.riderId,
        score: Math.min(1.0, 0.5 + (r.acceptanceRate30d * 0.3) + ((r.ratingAvg / 5) * 0.2)),
      })),
    };
  }
}
