import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly db: DatabaseService) {}

  async createReview(customerId: string, dto: CreateReviewDto) {
    const order = await this.db.queryOne(
      `SELECT o.*, d.rider_id
       FROM orders o
       LEFT JOIN deliveries d ON d.order_id = o.id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [dto.orderId, customerId],
    );

    if (!order) {
      throw new NotFoundException('Order not found or unauthorized');
    }

    const existing = await this.db.queryOne(
      `SELECT id FROM reviews WHERE order_id = $1`,
      [dto.orderId],
    );
    if (existing) {
      throw new ConflictException('A review has already been submitted for this order');
    }

    const review = await this.db.queryOne(
      `INSERT INTO reviews (
        order_id, customer_id, vendor_id, rider_id,
        vendor_rating, rider_rating, comment
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        order.id,
        customerId,
        order.vendor_id,
        order.rider_id || null,
        dto.vendorRating || null,
        dto.riderRating || null,
        dto.comment || null,
      ],
    );

    // If rider rated, recalculate rider's rating_avg
    if (order.rider_id && dto.riderRating) {
      await this.db.query(
        `UPDATE riders
         SET rating_avg = (
           SELECT ROUND(AVG(rider_rating)::numeric, 2)
           FROM reviews
           WHERE rider_id = $1 AND rider_rating IS NOT NULL
         )
         WHERE id = $1`,
        [order.rider_id],
      );
    }

    return review;
  }

  async getVendorReviews(vendorId: string) {
    return this.db.queryMany(
      `SELECT r.*, u.full_name as customer_name
       FROM reviews r
       JOIN users u ON u.id = r.customer_id
       WHERE r.vendor_id = $1 AND r.vendor_rating IS NOT NULL
       ORDER BY r.created_at DESC`,
      [vendorId],
    );
  }
}
