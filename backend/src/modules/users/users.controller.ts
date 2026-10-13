import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return this.usersService.findById(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @CurrentUser() user: any,
    @Body() body: { fullName?: string; email?: string },
  ) {
    return this.usersService.updateProfile(user.sub, body);
  }

  @Get('me/addresses')
  @UseGuards(JwtAuthGuard)
  async getMyAddresses(@CurrentUser() user: any) {
    return this.usersService.getAddresses(user.sub);
  }

  @Post('me/addresses')
  @UseGuards(JwtAuthGuard)
  async addMyAddress(
    @CurrentUser() user: any,
    @Body() body: { label: string; addressText: string; landmark?: string; isDefault?: boolean },
  ) {
    return this.usersService.addAddress(user.sub, body);
  }

  @Patch('me/addresses/:id/delete')
  @UseGuards(JwtAuthGuard)
  async deleteMyAddress(@CurrentUser() user: any, @Body('id') id: string) {
    return this.usersService.deleteAddress(user.sub, id);
  }
}
