import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FraudService } from './fraud.service';

class ScoreOrderDto {
  orderId: string;
}

class ResolveReviewDto {
  decision: 'APPROVED' | 'REJECTED';
  notes: string;
}

@Controller()
export class FraudController {
  constructor(private readonly fraudService: FraudService) {}

  @Post('ai/fraud/score')
  @HttpCode(HttpStatus.OK)
  async scoreOrder(@Body() dto: ScoreOrderDto) {
    return this.fraudService.scoreOrder(dto.orderId);
  }

  @Get('admin/ai/fraud/review-queue')
  async getReviewQueue(@Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.fraudService.getReviewQueue(status);
  }

  @Post('admin/ai/fraud/review-queue/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveReview(
    @Param('id') id: string,
    @Body() dto: ResolveReviewDto,
  ) {
    return this.fraudService.resolveReviewQueueItem(id, dto.decision, dto.notes);
  }
}
