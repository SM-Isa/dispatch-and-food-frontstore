import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SupportService, CreateTicketDto } from './support.service';

class AddMessageDto {
  body: string;
  authorType: 'CUSTOMER' | 'HUMAN';
  authorId?: string;
}

@Controller()
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('support/tickets')
  @HttpCode(HttpStatus.CREATED)
  async createTicket(@Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(dto);
  }

  @Get('support/tickets/:id')
  async getTicket(@Param('id') id: string) {
    return this.supportService.getTicket(id);
  }

  @Post('support/tickets/:id/messages')
  @HttpCode(HttpStatus.OK)
  async addMessage(
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
  ) {
    return this.supportService.addMessage(id, dto.body, dto.authorType, dto.authorId);
  }

  @Get('admin/ai/support/metrics')
  async getMetrics() {
    return this.supportService.getMetrics();
  }
}
