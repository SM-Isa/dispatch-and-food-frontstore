import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, OrderStatus } from '@dispatch/shared';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPPORT)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  async getOverviewMetrics() {
    return this.adminService.getOverviewMetrics();
  }

  @Get('orders')
  async getOrders(@Query('status') status?: string, @Query('limit') limit?: number) {
    return this.adminService.getOrders(status, limit ? Number(limit) : 50);
  }

  @Patch('orders/:id/force-status')
  async forceUpdateOrderStatus(
    @Param('id') id: string,
    @Body('toStatus') toStatus: OrderStatus,
    @Body('note') note: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.forceUpdateOrderStatus(id, toStatus, user.sub, note);
  }

  @Get('vendors')
  async getVendors() {
    return this.adminService.getVendors();
  }

  @Patch('vendors/:id/commission')
  async updateCommission(
    @Param('id') id: string,
    @Body('commissionBps') commissionBps: number,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateVendorCommission(id, commissionBps, user.sub);
  }

  @Patch('vendors/:id/status')
  async toggleVendorStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() user: any,
  ) {
    return this.adminService.toggleVendorStatus(id, isActive, user.sub);
  }

  @Get('riders')
  async getRiders() {
    return this.adminService.getRiders();
  }

  @Patch('riders/:id/approve')
  async approveRider(
    @Param('id') id: string,
    @Body('isApproved') isApproved: boolean,
    @CurrentUser() user: any,
  ) {
    return this.adminService.setRiderApproval(id, isApproved, user.sub);
  }

  @Get('payouts')
  async getPayouts() {
    return this.adminService.getPayouts();
  }

  @Get('reconciliation')
  async getReconciliation() {
    return this.adminService.getReconciliation();
  }
}
