import { Controller, Get, Query } from '@nestjs/common';
import { ForecastService } from './forecast.service';

@Controller('ai/dispatch')
export class ForecastController {
  constructor(private readonly forecastService: ForecastService) {}

  @Get('forecast')
  async getForecast(@Query('cluster') cluster?: string) {
    return this.forecastService.getClusterForecast(cluster);
  }

  @Get('repositioning-advice')
  async getRepositioningAdvice() {
    return this.forecastService.getRepositioningAdvice();
  }
}
