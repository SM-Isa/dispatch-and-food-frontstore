import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  Optional,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { LedgerService } from '../ledger/ledger.service';
import { PaymentProvider, OrderStatus } from '@dispatch/shared';
import {
  IPaymentGateway,
  PAYMENT_GATEWAY,
} from './interfaces/payment-gateway.interface';
import { MockPaymentGateway } from './gateways/mock-payment.gateway';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly gateway: IPaymentGateway;

  constructor(
    private readonly db: DatabaseService,
    private readonly ledgerService: LedgerService,
    @Optional()
    @Inject(PAYMENT_GATEWAY)
    gateway?: IPaymentGateway,
  ) {
    // Default to MockPaymentGateway if not explicitly provided (e.g. in standalone unit tests)
    this.gateway = gateway || new MockPaymentGateway();
  }

  /**
   * Generates a Monnify/Korapay dynamic virtual account for instant bank transfer
   * Delegates to the active gateway profile (Mock vs Monnify Production)
   */
  async initiatePayment(orderId: string, provider: PaymentProvider = PaymentProvider.MONNIFY) {
    const order = await this.db.queryOne(
      `SELECT o.*, u.full_name as customer_name, u.phone_number as customer_phone, u.email as customer_email
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       WHERE o.id = $1`,
      [orderId],
    );

    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(`Order is already in '${order.status}' status`);
    }

    // Generate unique payment reference
    const paymentReference = `PAY-${order.order_number}-${Date.now().toString().slice(-6)}`;

    // Delegate virtual account generation to the profile-configured gateway
    const virtualAccount = await this.gateway.initiateVirtualAccount({
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: parseFloat(order.total_amount),
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      paymentReference,
      provider,
    });

    // Save payment reference to order
    await this.db.query(
      `UPDATE orders
       SET payment_reference = $1, payment_provider = $2, updated_at = now()
       WHERE id = $3`,
      [paymentReference, provider, order.id],
    );

    return {
      success: true,
      orderNumber: order.order_number,
      totalAmount: parseFloat(order.total_amount),
      virtualAccount,
      gatewayMode: this.gateway.getMode(),
    };
  }

  /**
   * Idempotent Webhook Handler for Monnify & Korapay
   */
  async handleWebhook(
    provider: PaymentProvider,
    eventId: string,
    eventType: string,
    payload: Record<string, any>,
    signatureValid: boolean = true,
  ) {
    this.logger.log(`Received webhook from ${provider} [event: ${eventType}, id: ${eventId}, mode: ${this.gateway.getMode()}]`);

    // 1. Insert-first into webhook_events with ON CONFLICT DO NOTHING (idempotency log)
    const insertRes = await this.db.query(
      `INSERT INTO webhook_events (provider, event_id, event_type, payload, signature_valid)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (provider, event_id) DO NOTHING
       RETURNING id`,
      [provider, eventId, eventType, JSON.stringify(payload), signatureValid],
    );

    // Duplicate event detected — return 200 immediately
    if (insertRes.rowCount === 0) {
      this.logger.warn(`Duplicate webhook event ignored: ${provider}/${eventId}`);
      return { status: 'duplicate_ignored' };
    }

    const webhookEventId = insertRes.rows[0].id;

    // Process payment success events
    const isPaymentSuccess =
      eventType === 'payment.success' ||
      eventType === 'SUCCESSFUL_TRANSACTION' ||
      payload?.paymentStatus === 'PAID';

    if (!isPaymentSuccess) {
      await this.db.query(
        `UPDATE webhook_events SET processed_at = now() WHERE id = $1`,
        [webhookEventId],
      );
      return { status: 'unhandled_event_type', eventType };
    }

    // Extract reference (from Monnify transactionReference or Korapay reference)
    const paymentReference =
      payload.paymentReference ||
      payload.transactionReference ||
      payload.reference;

    if (!paymentReference) {
      await this.db.query(
        `UPDATE webhook_events 
         SET process_error = 'Missing paymentReference in payload', processed_at = now() 
         WHERE id = $1`,
        [webhookEventId],
      );
      throw new BadRequestException('Webhook payload missing payment reference');
    }

    // 2. Atomic Transaction: Update Order -> Post Double-Entry Ledger -> Provision Delivery
    await this.db.transaction(async (client) => {
      const orderRes = await client.query(
        `SELECT o.*, v.store_name, v.address_text as vendor_address, v.location as vendor_location,
                u.phone_number as customer_phone
         FROM orders o
         JOIN vendors v ON v.id = o.vendor_id
         JOIN users u ON u.id = o.customer_id
         WHERE o.payment_reference = $1 OR o.order_number = $1
         FOR UPDATE`,
        [paymentReference],
      );

      const order = orderRes.rows[0];
      if (!order) {
        throw new NotFoundException(`Order with reference '${paymentReference}' not found`);
      }

      if (order.status !== OrderStatus.PENDING) {
        this.logger.log(`Order ${order.order_number} already processed (${order.status})`);
        return;
      }

      const totalAmount = parseFloat(order.total_amount);

      // A. Update Order Status
      await client.query(
        `UPDATE orders
         SET status = 'PAID', paid_at = now(), updated_at = now()
         WHERE id = $1`,
        [order.id],
      );

      // B. Write to order_status_history
      await client.query(
        `INSERT INTO order_status_history (order_id, from_status, to_status, note, metadata)
         VALUES ($1, 'PENDING', 'PAID', 'Payment confirmed via webhook', $2)`,
        [order.id, JSON.stringify({ provider, eventId, paymentReference })],
      );

      // C. Post balanced double-entry ledger entries (Escrow lock)
      await this.ledgerService.recordOrderPaymentReceived(
        client,
        order.id,
        totalAmount,
        paymentReference,
      );

      // D. Provision delivery for dispatch engine
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
          order.id,
          order.vendor_address || 'Vendor Storefront',
          order.vendor_location,
          order.delivery_address,
          order.delivery_location || order.vendor_location,
        ],
      );

      // E. Transactional notifications fan-out
      await client.query(
        `INSERT INTO notifications_outbox (channel, recipient, template, payload)
         VALUES 
           ('SMS', $1, 'ORDER_PAID', $2),
           ('PUSH', $1, 'ORDER_PAID', $2)`,
        [
          order.customer_phone,
          JSON.stringify({ orderNumber: order.order_number, totalAmount }),
        ],
      );

      // F. Mark webhook event as processed
      await client.query(
        `UPDATE webhook_events SET processed_at = now() WHERE id = $1`,
        [webhookEventId],
      );
    });

    return { status: 'processed_success', paymentReference };
  }
}
