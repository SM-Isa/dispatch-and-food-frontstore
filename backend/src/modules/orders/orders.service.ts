import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus, DeliveryStatus } from '@dispatch/shared';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Helper to generate human-readable unique order identifier (e.g. 'ORD-7K2X9P')
   */
  private generateOrderNumber(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ORD-${code}`;
  }

  async create(customerId: string, dto: CreateOrderDto) {
    return this.db.transaction(async (client) => {
      // 1. Fetch vendor to snapshot commission_bps and location
      const vendorRes = await client.query(
        `SELECT id, store_name, address_text, location, commission_bps, is_open, is_active
         FROM vendors WHERE id = $1 AND deleted_at IS NULL`,
        [dto.vendorId],
      );
      const vendor = vendorRes.rows[0];
      if (!vendor) {
        throw new NotFoundException(`Vendor '${dto.vendorId}' not found`);
      }
      if (!vendor.is_open || !vendor.is_active) {
        throw new BadRequestException(`Vendor is currently closed and not accepting orders`);
      }

      // 2. Fetch and snapshot products
      let subtotal = 0;
      const snapshotItems: Array<{
        productId: string;
        vendorId: string;
        productName: string;
        productImageUrl: string | null;
        quantity: number;
        unitPrice: number;
        notes: string | null;
      }> = [];

      for (const item of dto.items) {
        const prodRes = await client.query(
          `SELECT id, name, price, is_available, is_published, image_url
           FROM products WHERE id = $1 AND vendor_id = $2 AND deleted_at IS NULL`,
          [item.productId, dto.vendorId],
        );
        const product = prodRes.rows[0];
        if (!product) {
          throw new NotFoundException(`Product '${item.productId}' not found in vendor menu`);
        }
        if (!product.is_available || !product.is_published) {
          throw new BadRequestException(`Product '${product.name}' is currently unavailable`);
        }

        const unitPrice = parseFloat(product.price);
        subtotal += unitPrice * item.quantity;

        snapshotItems.push({
          productId: product.id,
          vendorId: vendor.id,
          productName: product.name,
          productImageUrl: product.image_url,
          quantity: item.quantity,
          unitPrice,
          notes: item.notes || null,
        });
      }

      const deliveryFee = dto.deliveryFee !== undefined ? dto.deliveryFee : 800;
      const platformFee = 100.0; // Flat platform service fee NGN 100
      const discount = 0.0;
      const totalAmount = subtotal + deliveryFee + platformFee - discount;
      const orderNumber = this.generateOrderNumber();

      // 3. Insert order record
      const hasDeliveryCoords = dto.deliveryLongitude !== undefined && dto.deliveryLatitude !== undefined;
      const orderInsertRes = await client.query(
        `INSERT INTO orders (
          order_number, customer_id, vendor_id, status,
          subtotal, delivery_fee, platform_fee, discount, total_amount,
          commission_bps, delivery_address, delivery_location, notes
        )
        VALUES (
          $1, $2, $3, 'PENDING',
          $4, $5, $6, $7, $8,
          $9, $10, ${hasDeliveryCoords ? 'ST_SetSRID(ST_MakePoint($11, $12), 4326)::geography' : 'NULL'}, $13
        )
        RETURNING *`,
        hasDeliveryCoords
          ? [
              orderNumber, customerId, vendor.id,
              subtotal, deliveryFee, platformFee, discount, totalAmount,
              vendor.commission_bps, dto.deliveryAddress, dto.deliveryLongitude, dto.deliveryLatitude, dto.notes || null
            ]
          : [
              orderNumber, customerId, vendor.id,
              subtotal, deliveryFee, platformFee, discount, totalAmount,
              vendor.commission_bps, dto.deliveryAddress, null, dto.notes || null
            ]
      );
      const order = orderInsertRes.rows[0];

      // 4. Insert order items snapshots
      for (const item of snapshotItems) {
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, vendor_id,
            product_name, product_image_url, quantity, unit_price, notes
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            order.id, item.productId, item.vendorId,
            item.productName, item.productImageUrl, item.quantity, item.unitPrice, item.notes
          ],
        );
      }

      // 5. Non-negotiable order status history record
      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, note)
         VALUES ($1, NULL, 'PENDING', $2, 'Order placed by customer')`,
        [order.id, customerId],
      );

      // 6. Transactional outbox notification
      await client.query(
        `INSERT INTO notifications_outbox (channel, recipient, template, payload, status)
         VALUES ('SMS', (SELECT phone_number FROM users WHERE id = $1), 'ORDER_PLACED', $2, 'PENDING')`,
        [customerId, JSON.stringify({ orderNumber, totalAmount, vendorName: vendor.store_name })],
      );

      return {
        ...order,
        items: snapshotItems,
      };
    });
  }

  async updateStatus(orderId: string, dto: UpdateOrderStatusDto, actorId?: string) {
    return this.db.transaction(async (client) => {
      const currentRes = await client.query(
        `SELECT * FROM orders WHERE id = $1`,
        [orderId],
      );
      const order = currentRes.rows[0];
      if (!order) {
        throw new NotFoundException(`Order '${orderId}' not found`);
      }

      const fromStatus = order.status;
      const toStatus = dto.status;

      // Update order status
      const updatedRes = await client.query(
        `UPDATE orders
         SET status = $1, updated_at = now()
         WHERE id = $2
         RETURNING *`,
        [toStatus, orderId],
      );
      const updatedOrder = updatedRes.rows[0];

      // Always write to order_status_history
      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, note, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, fromStatus, toStatus, actorId || null, dto.note || null, dto.metadata ? JSON.stringify(dto.metadata) : null],
      );

      // When order transition to PAID or PREPARING: automatically ensure a Delivery record exists!
      if ((toStatus === OrderStatus.PAID || toStatus === OrderStatus.PREPARING) && fromStatus !== OrderStatus.PAID) {
        const vendorRes = await client.query(
          `SELECT address_text, location FROM vendors WHERE id = $1`,
          [order.vendor_id],
        );
        const vendor = vendorRes.rows[0];

        await client.query(
          `INSERT INTO deliveries (
            order_id, status, pickup_address, pickup_location,
            dropoff_address, dropoff_location
          )
          VALUES (
            $1, 'LOOKING_FOR_RIDER', $2, $3,
            $4, COALESCE($5, $3)
          )
          ON CONFLICT (order_id) DO NOTHING`,
          [
            orderId,
            vendor.address_text || 'Vendor Storefront',
            vendor.location,
            order.delivery_address,
            order.delivery_location || vendor.location,
          ],
        );
      }

      return updatedOrder;
    });
  }

  async findById(id: string) {
    const order = await this.db.queryOne(
      `SELECT * FROM orders WHERE id = $1`,
      [id],
    );
    if (!order) {
      throw new NotFoundException(`Order '${id}' not found`);
    }

    const items = await this.db.queryMany(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [id],
    );

    const history = await this.db.queryMany(
      `SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at ASC`,
      [id],
    );

    return {
      ...order,
      items,
      history,
    };
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.db.queryOne(
      `SELECT o.*, v.store_name as vendor_name, v.phone_number as vendor_phone
       FROM orders o
       JOIN vendors v ON v.id = o.vendor_id
       WHERE o.order_number = $1`,
      [orderNumber],
    );
    if (!order) {
      throw new NotFoundException(`Order '${orderNumber}' not found`);
    }

    const items = await this.db.queryMany(
      `SELECT * FROM order_items WHERE order_id = $1`,
      [order.id],
    );

    const delivery = await this.db.queryOne(
      `SELECT d.*, r.vehicle_type, r.vehicle_plate, u.full_name as rider_name, u.phone_number as rider_phone
       FROM deliveries d
       LEFT JOIN riders r ON r.id = d.rider_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE d.order_id = $1`,
      [order.id],
    );

    return {
      ...order,
      items,
      delivery,
    };
  }

  async findCustomerOrders(customerId: string) {
    return this.db.queryMany(
      `SELECT o.*, v.store_name
       FROM orders o
       JOIN vendors v ON v.id = o.vendor_id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`,
      [customerId],
    );
  }

  async findVendorOrders(vendorId: string, status?: OrderStatus) {
    let query = `
      SELECT o.*, u.full_name as customer_name, u.phone_number as customer_phone
      FROM orders o
      JOIN users u ON u.id = o.customer_id
      WHERE o.vendor_id = $1
    `;
    const params: any[] = [vendorId];
    if (status) {
      params.push(status);
      query += ` AND o.status = $2`;
    }
    query += ` ORDER BY o.created_at DESC`;
    return this.db.queryMany(query, params);
  }
}
