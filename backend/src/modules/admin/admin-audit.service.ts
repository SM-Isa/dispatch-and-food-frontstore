// src/modules/admin/admin-audit.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: {
    userId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    await this.prisma.adminAuditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        targetType: input.targetType || null,
        targetId: input.targetId || null,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        metadata: input.metadata ?? {},
      },
    });
  }
}
