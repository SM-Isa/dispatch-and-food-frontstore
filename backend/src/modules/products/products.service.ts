import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateProductDto) {
    const row = await this.db.queryOne(
      `INSERT INTO products (
        vendor_id, name, description, price, is_available, is_published,
        image_url, sort_order, category
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        dto.vendorId,
        dto.name,
        dto.description || null,
        dto.price,
        dto.isAvailable !== undefined ? dto.isAvailable : true,
        dto.isPublished !== undefined ? dto.isPublished : true,
        dto.imageUrl || null,
        dto.sortOrder || 0,
        dto.category || 'General',
      ],
    );

    return row;
  }

  async update(id: string, dto: UpdateProductDto) {
    const fields: string[] = [];
    const params: any[] = [id];

    if (dto.name !== undefined) {
      params.push(dto.name);
      fields.push(`name = $${params.length}`);
    }
    if (dto.description !== undefined) {
      params.push(dto.description);
      fields.push(`description = $${params.length}`);
    }
    if (dto.price !== undefined) {
      params.push(dto.price);
      fields.push(`price = $${params.length}`);
    }
    if (dto.isAvailable !== undefined) {
      params.push(dto.isAvailable);
      fields.push(`is_available = $${params.length}`);
    }
    if (dto.isPublished !== undefined) {
      params.push(dto.isPublished);
      fields.push(`is_published = $${params.length}`);
    }
    if (dto.imageUrl !== undefined) {
      params.push(dto.imageUrl);
      fields.push(`image_url = $${params.length}`);
    }
    if (dto.sortOrder !== undefined) {
      params.push(dto.sortOrder);
      fields.push(`sort_order = $${params.length}`);
    }
    if (dto.category !== undefined) {
      params.push(dto.category);
      fields.push(`category = $${params.length}`);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    const row = await this.db.queryOne(
      `UPDATE products SET ${fields.join(', ')}, updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      params,
    );

    if (!row) {
      throw new NotFoundException(`Product '${id}' not found`);
    }

    return row;
  }

  async findById(id: string) {
    const row = await this.db.queryOne(
      `SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (!row) {
      throw new NotFoundException(`Product '${id}' not found`);
    }
    return row;
  }

  async findByVendor(vendorId: string, includeUnpublished = false) {
    let query = `
      SELECT * FROM products
      WHERE vendor_id = $1 AND deleted_at IS NULL
    `;
    if (!includeUnpublished) {
      query += ` AND is_published = true`;
    }
    query += ` ORDER BY sort_order ASC, name ASC`;

    return this.db.queryMany(query, [vendorId]);
  }

  async softDelete(id: string) {
    const row = await this.db.queryOne(
      `UPDATE products SET deleted_at = now() WHERE id = $1 RETURNING id`,
      [id],
    );
    if (!row) {
      throw new NotFoundException(`Product '${id}' not found`);
    }
    return { success: true, message: `Product '${id}' deleted` };
  }
}
