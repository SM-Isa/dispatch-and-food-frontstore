import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RidersService } from './riders.service';
import { CreateRiderProfileDto, HeartbeatDto } from './dto/rider.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@dispatch/shared';

@Controller('riders')
export class RidersController {
  constructor(private readonly ridersService: RidersService) {}

  @Post('profile')
  @UseGuards(JwtAuthGuard)
  async createProfile(@CurrentUser() user: any, @Body() dto: CreateRiderProfileDto) {
    return this.ridersService.createProfile(user.sub, dto);
  }

  @Get('profile/me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser() user: any) {
    return this.ridersService.getProfile(user.sub);
  }

  @Post('heartbeat')
  @UseGuards(JwtAuthGuard)
  async heartbeat(@CurrentUser() user: any, @Body() dto: HeartbeatDto) {
    return this.ridersService.updateHeartbeat(user.sub, dto);
  }

  @Patch('online')
  @UseGuards(JwtAuthGuard)
  async toggleOnline(@CurrentUser() user: any, @Body('isOnline') isOnline: boolean) {
    return this.ridersService.toggleOnline(user.sub, isOnline);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async approveRider(@Param('id') id: string) {
    return this.ridersService.approveRider(id);
  }
}
