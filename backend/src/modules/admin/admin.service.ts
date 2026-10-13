import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { AdminAuditService } from './admin-audit.service';
import { OrderStatus } from '@dispatch/shared';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly auditService: AdminAuditService,
  ) {}

  async getOverviewMetrics() {
    const ordersTodayRes = await this.db.queryOne(
      `SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_gmv
       FROM orders WHERE created_at >= CURRENT_DATE`,
    );

    const activeOrdersRes = await this.db.queryOne(
      `SELECT COUNT(*) as active_count
       FROM orders WHERE status IN ('PAID', 'PREPARING', 'AWAITING_RIDER', 'RIDER_ASSIGNED', 'PICKED_UP')`,
    );

    const onlineRidersRes = await this.db.queryOne(
      `SELECT COUNT(*) as online_riders FROM riders WHERE is_online = true AND is_approved = true`,
    );

    const activeVendorsRes = await this.db.queryOne(
      `SELECT COUNT(*) as active_vendors FROM vendors WHERE is_open = true AND is_active = true`,
    );

    const escrowBalanceRes = await this.db.queryOne(
      `SELECT balance FROM wallets WHERE ledger_type = 'CUSTOMER_ESCROW' LIMIT 1`,
    );

    return {
      totalGmvToday: parseFloat(ordersTodayRes?.total_gmv || '0'),
      ordersCountToday: parseInt(ordersTodayRes?.total_orders || '0', 10),
      activeOrdersCount: parseInt(activeOrdersRes?.active_count || '0', 10),
      onlineRidersCount: parseInt(onlineRidersRes?.online_riders || '0', 10),
      activeVendorsCount: parseInt(activeVendorsRes?.active_vendors || '0', 10),
      escrowBalance: parseFloat(escrowBalanceRes?.balance || '0'),
    };
  }

  async getOrders(status?: string, limit: number = 30) {
    const params: any[] = [limit];
    let whereClause = '';
    if (status && status !== 'ALL') {
      params.push(status);
      whereClause = `WHERE o.status = $2`;
    }

    return this.db.queryMany(
      `SELECT o.*, u.full_name as customer_name, u.phone_number as customer_phone,
              v.store_name, v.cluster_zone
       FROM orders o
       JOIN users u ON u.id = o.customer_id
       JOIN vendors v ON v.id = o.vendor_id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $1`,
      params,
    );
  }

  async forceUpdateOrderStatus(orderId: string, toStatus: OrderStatus, adminUserId: string, note?: string) {
    const order = await this.db.queryOne(`SELECT * FROM orders WHERE id = $1`, [orderId]);
    if (!order) {
      throw new NotFoundException(`Order '${orderId}' not found`);
    }

    const fromStatus = order.status;
    await this.db.query(
      `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2`,
      [toStatus, orderId],
    );

    await this.db.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, fromStatus, toStatus, adminUserId, note || 'Status force-updated by admin'],
    );

    await this.auditService.log({
      userId: adminUserId,
      action: 'ORDER_FORCE_STATUS_CHANGE',
      targetType: 'ORDER',
      targetId: orderId,
      metadata: { fromStatus, toStatus, note },
    });

    return { success: true, orderId, fromStatus, toStatus };
  }

  async getVendors() {
    return this.db.queryMany(
      `SELECT v.*, u.full_name as owner_name, u.email as owner_email,
              (SELECT COUNT(*) FROM orders o WHERE o.vendor_id = v.id) as total_orders,
              (SELECT COALESCE(SUM(total_amount), 0) FROM orders o WHERE o.vendor_id = v.id) as total_sales
       FROM vendors v
       JOIN users u ON u.id = v.user_id
       WHERE v.deleted_at IS NULL
       ORDER BY v.created_at DESC`,
    );
  }

  async updateVendorCommission(vendorId: string, commissionBps: number, adminUserId: string) {
    if (commissionBps < 0 || commissionBps > 5000) {
      throw new BadRequestException('Commission rate must be between 0 and 5000 bps (0% to 50%)');
    }

    const vendor = await this.db.queryOne(
      `UPDATE vendors SET commission_bps = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [commissionBps, vendorId],
    );
    if (!vendor) throw new NotFoundException('Vendor not found');

    await this.auditService.log({
      userId: adminUserId,
      action: 'VENDOR_COMMISSION_ADJUST',
      targetType: 'VENDOR',
      targetId: vendorId,
      metadata: { newCommissionBps: commissionBps },
    });

    return vendor;
  }

  async toggleVendorStatus(vendorId: string, isActive: boolean, adminUserId: string) {
    const vendor = await this.db.queryOne(
      `UPDATE vendors SET is_active = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [isActive, vendorId],
    );
    if (!vendor) throw new NotFoundException('Vendor not found');

    await this.auditService.log({
      userId: adminUserId,
      action: isActive ? 'VENDOR_ACTIVATE' : 'VENDOR_SUSPEND',
      targetType: 'VENDOR',
      targetId: vendorId,
      metadata: { isActive },
    });

    return vendor;
  }

  async getRiders() {
    return this.db.queryMany(
      `SELECT r.*, u.full_name as rider_name, u.phone_number, u.email
       FROM riders r
       JOIN users u ON u.id = r.user_id
       WHERE r.deleted_at IS NULL
       ORDER BY r.created_at DESC`,
    );
  }

  async setRiderApproval(riderId: string, isApproved: boolean, adminUserId: string) {
    const rider = await this.db.queryOne(
      `UPDATE riders SET is_approved = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [isApproved, riderId],
    );
    if (!rider) throw new NotFoundException('Rider not found');

    await this.auditService.log({
      userId: adminUserId,
      action: isApproved ? 'RIDER_APPROVE' : 'RIDER_SUSPEND',
      targetType: 'RIDER',
      targetId: riderId,
      metadata: { isApproved },
    });

    return rider;
  }

  async getPayouts() {
    return this.db.queryMany(
      `SELECT p.*, w.ledger_type, u.full_name as payee_name, u.phone_number as payee_phone
       FROM payouts p
       JOIN wallets w ON w.id = p.wallet_id
       LEFT JOIN users u ON u.id = w.owner_id
       ORDER BY p.initiated_at DESC
       LIMIT 50`,
    );
  }

  async getReconciliation() {
    const wallets = await this.db.queryMany(
      `SELECT id, ledger_type, currency, balance, is_locked FROM wallets ORDER BY ledger_type ASC`,
    );

    const balanceCheck = await this.db.queryOne(
      `SELECT 
        COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount ELSE 0 END), 0) as total_debits,
        COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount ELSE 0 END), 0) as total_credits
       FROM ledger_entries`,
    );

    const totalDebits = parseFloat(balanceCheck?.total_debits || '0');
    const totalCredits = parseFloat(balanceCheck?.total_credits || '0');
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return {
      isBalanced,
      totalDebits,
      totalCredits,
      discrepancy: Math.abs(totalDebits - totalCredits),
      wallets,
      checkedAt: new Date().toISOString(),
    };
  }
}
