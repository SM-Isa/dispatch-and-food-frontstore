import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { FindVendorsDto } from './dto/find-vendors.dto';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(userId: string, dto: CreateVendorDto) {
    const existing = await this.db.queryOne(
      `SELECT id FROM vendors WHERE slug = $1`,
      [dto.slug],
    );
    if (existing) {
      throw new ConflictException(`Vendor with slug '${dto.slug}' already exists`);
    }

    const row = await this.db.queryOne(
      `INSERT INTO vendors (
        user_id, store_name, slug, cluster_zone,
        location, address_text, phone_number,
        logo_url, banner_url, commission_bps, is_open
      )
      VALUES (
        $1, $2, $3, $4,
        ST_SetSRID(ST_MakePoint($5, $6), 4326)::geography,
        $7, $8, $9, $10, $11, true
      )
      RETURNING 
        id, user_id, store_name, slug, cluster_zone,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        address_text, is_active, is_open, logo_url, banner_url,
        phone_number, commission_bps, created_at`,
      [
        userId,
        dto.storeName,
        dto.slug.toLowerCase().trim(),
        dto.clusterZone.toUpperCase(),
        dto.longitude,
        dto.latitude,
        dto.addressText || null,
        dto.phoneNumber || null,
        dto.logoUrl || null,
        dto.bannerUrl || null,
        dto.commissionBps || 1500,
      ],
    );

    return row;
  }

  /**
   * Fast SSR lookups for WhatsApp / Instagram shared links
   */
  async findBySlug(slug: string) {
    const vendor = await this.db.queryOne(
      `SELECT 
        id, user_id, store_name, slug, cluster_zone,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        address_text, is_active, is_open, logo_url, banner_url,
        phone_number, commission_bps, created_at
      FROM vendors
      WHERE slug = $1 AND deleted_at IS NULL`,
      [slug.toLowerCase().trim()],
    );

    if (!vendor) {
      throw new NotFoundException(`Vendor storefront '${slug}' not found`);
    }

    // Load vendor's active products (published & ordered)
    const products = await this.db.queryMany(
      `SELECT id, vendor_id, name, description, price, is_available, is_published,
              image_url, sort_order, category, created_at
       FROM products
       WHERE vendor_id = $1 
         AND deleted_at IS NULL 
         AND is_published = true
       ORDER BY sort_order ASC, name ASC`,
      [vendor.id],
    );

    return {
      ...vendor,
      products,
    };
  }

  async findById(id: string) {
    const vendor = await this.db.queryOne(
      `SELECT 
        id, user_id, store_name, slug, cluster_zone,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        address_text, is_active, is_open, logo_url, banner_url,
        phone_number, commission_bps, created_at
      FROM vendors
      WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );

    if (!vendor) {
      throw new NotFoundException(`Vendor '${id}' not found`);
    }

    return vendor;
  }

  /**
   * Geospatial search using PostGIS ST_DWithin or Cluster filtering
   */
  async findAll(dto: FindVendorsDto) {
    const params: any[] = [];
    let query = `
      SELECT 
        v.id, v.user_id, v.store_name, v.slug, v.cluster_zone,
        ST_X(v.location::geometry) as longitude,
        ST_Y(v.location::geometry) as latitude,
        v.address_text, v.is_active, v.is_open, v.logo_url, v.banner_url,
        v.phone_number, v.commission_bps, v.created_at
    `;

    if (dto.longitude !== undefined && dto.latitude !== undefined) {
      params.push(dto.longitude, dto.latitude, dto.radiusMeters || 5000);
      query += `,
        ST_Distance(
          v.location, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance_meters
        FROM vendors v
        WHERE v.deleted_at IS NULL 
          AND v.is_active = true
          AND ST_DWithin(
            v.location,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
          )
      `;
    } else {
      query += `
        FROM vendors v
        WHERE v.deleted_at IS NULL 
          AND v.is_active = true
      `;
    }

    if (dto.clusterZone) {
      params.push(dto.clusterZone.toUpperCase());
      query += ` AND v.cluster_zone = $${params.length}`;
    }

    if (dto.isOpenOnly) {
      query += ` AND v.is_open = true`;
    }

    if (dto.longitude !== undefined && dto.latitude !== undefined) {
      query += ` ORDER BY distance_meters ASC`;
    } else {
      query += ` ORDER BY v.store_name ASC`;
    }

    return this.db.queryMany(query, params);
  }

  async toggleOpen(vendorId: string, isOpen: boolean) {
    const updated = await this.db.queryOne(
      `UPDATE vendors
       SET is_open = $1, updated_at = now()
       WHERE id = $2 AND deleted_at IS NULL
       RETURNING id, store_name, is_open`,
      [isOpen, vendorId],
    );

    if (!updated) {
      throw new NotFoundException(`Vendor '${vendorId}' not found`);
    }

    return updated;
  }
}
