import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { DeliveryStatus, DispatchResponse } from '@prisma/client';

export interface DeliveryDispatchInfo {
  id: string;
  orderId: string;
  orderNumber: string;
  status: DeliveryStatus;
  cluster: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  deliveryFee: number;
}

@Injectable()
export class DispatchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDeliveryForDispatch(deliveryId: string): Promise<DeliveryDispatchInfo | null> {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT 
        d.id, d.order_id as "orderId", o.order_number as "orderNumber",
        d.status, v.cluster_zone as cluster,
        d.pickup_address as "pickupAddress", d.dropoff_address as "dropoffAddress",
        ST_Y(d.pickup_location::geometry) as "pickupLat",
        ST_X(d.pickup_location::geometry) as "pickupLng",
        ST_Y(d.dropoff_location::geometry) as "dropoffLat",
        ST_X(d.dropoff_location::geometry) as "dropoffLng",
        o.delivery_fee::float as "deliveryFee"
      FROM deliveries d
      JOIN orders o ON o.id = d.order_id
      JOIN vendors v ON v.id = o.vendor_id
      WHERE d.id = ${deliveryId}::uuid
      LIMIT 1
    `;

    return rows[0] || null;
  }

  async recordOfferAttempt(input: {
    deliveryId: string;
    riderId: string;
    offerRound: number;
    distanceMeters?: number;
  }) {
    return this.prisma.riderDispatchAttempt.upsert({
      where: {
        deliveryId_riderId_offerRound: {
          deliveryId: input.deliveryId,
          riderId: input.riderId,
          offerRound: input.offerRound,
        },
      },
      update: {
        offeredAt: new Date(),
        response: DispatchResponse.OFFERED,
      },
      create: {
        deliveryId: input.deliveryId,
        riderId: input.riderId,
        offerRound: input.offerRound,
        distanceMeters: input.distanceMeters,
        response: DispatchResponse.OFFERED,
      },
    });
  }

  async markOfferResponse(
    deliveryId: string,
    riderId: string,
    response: DispatchResponse,
  ) {
    const latestAttempt = await this.prisma.riderDispatchAttempt.findFirst({
      where: { deliveryId, riderId },
      orderBy: { offerRound: 'desc' },
    });

    if (latestAttempt) {
      await this.prisma.riderDispatchAttempt.update({
        where: { id: latestAttempt.id },
        data: {
          response,
          respondedAt: new Date(),
        },
      });
    }
  }

  async assignRider(deliveryId: string, riderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          riderId,
          status: DeliveryStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: delivery.orderId },
        data: { status: 'RIDER_ASSIGNED', updatedAt: new Date() },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: delivery.orderId,
          fromStatus: 'AWAITING_RIDER',
          toStatus: 'RIDER_ASSIGNED',
          note: `Rider ${riderId} accepted dispatch offer`,
        },
      });

      return delivery;
    });
  }
}
