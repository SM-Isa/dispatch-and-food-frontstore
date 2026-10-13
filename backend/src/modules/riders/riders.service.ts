import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { RedisService } from '../../common/redis/redis.service';
import { CreateRiderProfileDto, HeartbeatDto } from './dto/rider.dto';
import { UserRole, WalletType } from '@dispatch/shared';

@Injectable()
export class RidersService {
  private readonly logger = new Logger(RidersService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  async createProfile(userId: string, dto: CreateRiderProfileDto) {
    const existing = await this.db.queryOne(
      `SELECT id FROM riders WHERE user_id = $1`,
      [userId],
    );
    if (existing) {
      throw new BadRequestException('Rider profile already exists for this user');
    }

    // Update user role to RIDER
    await this.db.query(
      `UPDATE users SET role = $1 WHERE id = $2`,
      [UserRole.RIDER, userId],
    );

    // Create RIDER wallet
    await this.db.query(
      `INSERT INTO wallets (owner_id, ledger_type, currency, balance)
       VALUES ($1, $2, 'NGN', 0.00)
       ON CONFLICT (owner_id, ledger_type, currency) DO NOTHING`,
      [userId, WalletType.RIDER],
    );

    const rider = await this.db.queryOne(
      `INSERT INTO riders (
        user_id, vehicle_type, vehicle_plate, guarantor_name,
        guarantor_phone, current_cluster, is_online, is_approved
      )
      VALUES ($1, $2, $3, $4, $5, $6, false, false)
      RETURNING *`,
      [
        userId,
        dto.vehicleType,
        dto.vehiclePlate || null,
        dto.guarantorName,
        dto.guarantorPhone,
        dto.currentCluster || 'TANKE',
      ],
    );

    return rider;
  }

  /**
   * Lightweight GPS heartbeat for budget Android devices:
   * Sets Redis Geospatial key (low latency) and updates PostgreSQL fallback.
   */
  async updateHeartbeat(userId: string, dto: HeartbeatDto) {
    const rider = await this.db.queryOne(
      `SELECT id, current_cluster, is_approved, is_online FROM riders WHERE user_id = $1`,
      [userId],
    );

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    const cluster = dto.cluster || rider.current_cluster || 'TANKE';

    // 1. Redis Geospatial update
    if (rider.is_online && rider.is_approved) {
      await this.redis.updateRiderLocation(rider.id, dto.longitude, dto.latitude, cluster);
    }

    // 2. PostgreSQL fallback update
    await this.db.query(
      `UPDATE riders
       SET last_heartbeat_at = now(),
           last_location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           current_cluster = $3
       WHERE id = $4`,
      [dto.longitude, dto.latitude, cluster, rider.id],
    );

    return { success: true, timestamp: new Date().toISOString() };
  }

  async toggleOnline(userId: string, isOnline: boolean) {
    const rider = await this.db.queryOne(
      `SELECT id, is_approved, current_cluster FROM riders WHERE user_id = $1`,
      [userId],
    );

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    if (isOnline && !rider.is_approved) {
      throw new BadRequestException('Cannot go online: Guarantor verification and Admin approval required');
    }

    const updated = await this.db.queryOne(
      `UPDATE riders SET is_online = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [isOnline, rider.id],
    );

    if (!isOnline) {
      await this.redis.removeRiderFromDispatch(rider.id, rider.current_cluster || 'GLOBAL');
    }

    return updated;
  }

  async approveRider(riderId: string) {
    const updated = await this.db.queryOne(
      `UPDATE riders SET is_approved = true, updated_at = now() WHERE id = $1 RETURNING *`,
      [riderId],
    );
    if (!updated) {
      throw new NotFoundException('Rider not found');
    }
    return updated;
  }

  async getProfile(userId: string) {
    const rider = await this.db.queryOne(
      `SELECT r.*, u.phone_number, u.full_name, u.email,
              w.balance as wallet_balance
       FROM riders r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN wallets w ON w.owner_id = u.id AND w.ledger_type = 'RIDER'
       WHERE r.user_id = $1`,
      [userId],
    );

    if (!rider) {
      throw new NotFoundException('Rider profile not found');
    }

    return rider;
  }
}
