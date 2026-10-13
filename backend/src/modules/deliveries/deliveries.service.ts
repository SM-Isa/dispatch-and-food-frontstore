import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { DeliveryStatus, OrderStatus } from '@dispatch/shared';

@Injectable()
export class DeliveriesService {
  private readonly logger = new Logger(DeliveriesService.name);

  constructor(private readonly db: DatabaseService) {}

  async markPickedUp(deliveryId: string, riderUserId: string) {
    return this.db.transaction(async (client) => {
      const rider = (
        await client.query(`SELECT id FROM riders WHERE user_id = $1`, [riderUserId])
      ).rows[0];
      if (!rider) throw new NotFoundException('Rider profile not found');

      const delivery = (
        await client.query(
          `UPDATE deliveries
           SET status = 'PICKED_UP', picked_up_at = now(), updated_at = now()
           WHERE id = $1 AND rider_id = $2
           RETURNING *`,
          [deliveryId, rider.id],
        )
      ).rows[0];

      if (!delivery) {
        throw new NotFoundException('Delivery not found or not assigned to this rider');
      }

      // Update Order Status
      await client.query(
        `UPDATE orders SET status = 'PICKED_UP', updated_at = now() WHERE id = $1`,
        [delivery.order_id],
      );

      // Status history
      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, note)
         VALUES ($1, 'RIDER_ASSIGNED', 'PICKED_UP', $2, 'Rider picked up order from vendor')`,
        [delivery.order_id, riderUserId],
      );

      return delivery;
    });
  }

  async markDelivered(deliveryId: string, riderUserId: string, proofImageUrl?: string) {
    return this.db.transaction(async (client) => {
      const rider = (
        await client.query(`SELECT id FROM riders WHERE user_id = $1`, [riderUserId])
      ).rows[0];
      if (!rider) throw new NotFoundException('Rider profile not found');

      const delivery = (
        await client.query(
          `UPDATE deliveries
           SET status = 'DELIVERED', 
               delivered_at = now(), 
               proof_image_url = $3,
               updated_at = now()
           WHERE id = $1 AND rider_id = $2
           RETURNING *`,
          [deliveryId, rider.id, proofImageUrl || null],
        )
      ).rows[0];

      if (!delivery) {
        throw new NotFoundException('Delivery not found or not assigned to this rider');
      }

      // Update Order Status to DELIVERED (Rider dropoff marker)
      await client.query(
        `UPDATE orders SET status = 'DELIVERED', updated_at = now() WHERE id = $1`,
        [delivery.order_id],
      );

      // Increment rider delivery stats
      await client.query(
        `UPDATE riders SET total_deliveries = total_deliveries + 1 WHERE id = $1`,
        [rider.id],
      );

      // Status history
      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, note, metadata)
         VALUES ($1, 'PICKED_UP', 'DELIVERED', $2, 'Rider marked order delivered with dropoff proof', $3)`,
        [delivery.order_id, riderUserId, JSON.stringify({ proofImageUrl })],
      );

      return delivery;
    });
  }

  async getActiveDeliveryForRider(riderUserId: string) {
    const rider = await this.db.queryOne(
      `SELECT id FROM riders WHERE user_id = $1`,
      [riderUserId],
    );
    if (!rider) return null;

    return this.db.queryOne(
      `SELECT d.*, 
              o.order_number, o.subtotal, o.delivery_fee, o.notes as order_notes,
              v.store_name as vendor_name, v.phone_number as vendor_phone,
              u.full_name as customer_name, u.phone_number as customer_phone
       FROM deliveries d
       JOIN orders o ON o.id = d.order_id
       JOIN vendors v ON v.id = o.vendor_id
       JOIN users u ON u.id = o.customer_id
       WHERE d.rider_id = $1 AND d.status IN ('ACCEPTED', 'PICKED_UP')
       ORDER BY d.created_at DESC
       LIMIT 1`,
      [rider.id],
    );
  }
}
