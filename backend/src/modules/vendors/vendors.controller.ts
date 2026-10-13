import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { FindVendorsDto } from './dto/find-vendors.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@dispatch/shared';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  async findAll(@Query() query: FindVendorsDto) {
    return this.vendorsService.findAll(query);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.vendorsService.findBySlug(slug);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.vendorsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_OWNER, UserRole.ADMIN)
  async create(@CurrentUser() user: any, @Body() dto: CreateVendorDto) {
    return this.vendorsService.create(user.sub, dto);
  }

  @Patch(':id/toggle-open')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR_OWNER, UserRole.ADMIN)
  async toggleOpen(
    @Param('id') id: string,
    @Body('isOpen') isOpen: boolean,
  ) {
    return this.vendorsService.toggleOpen(id, isOpen);
  }
}
