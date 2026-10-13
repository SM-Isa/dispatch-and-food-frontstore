import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async findById(id: string) {
    const user = await this.db.queryOne(
      `SELECT id, phone_number, phone_verified_at, email, full_name, role, is_active, last_login_at, created_at
       FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (!user) {
      throw new NotFoundException(`User '${id}' not found`);
    }
    return user;
  }

  async updateProfile(id: string, updates: { fullName?: string; email?: string }) {
    const fields: string[] = [];
    const params: any[] = [id];

    if (updates.fullName) {
      params.push(updates.fullName);
      fields.push(`full_name = $${params.length}`);
    }
    if (updates.email) {
      params.push(updates.email.toLowerCase().trim());
      fields.push(`email = $${params.length}`);
    }

    if (fields.length === 0) return this.findById(id);

    const user = await this.db.queryOne(
      `UPDATE users SET ${fields.join(', ')}, updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id, phone_number, phone_verified_at, email, full_name, role, is_active, updated_at`,
      params,
    );
    return user;
  }
}
