import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminAuditService } from './admin-audit.service';
import { DatabaseModule } from '../../common/database/database.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, PrismaModule, AuthModule],
  controllers: [AdminController],
  providers: [AdminService, AdminAuditService],
  exports: [AdminService, AdminAuditService],
})
export class AdminModule {}
