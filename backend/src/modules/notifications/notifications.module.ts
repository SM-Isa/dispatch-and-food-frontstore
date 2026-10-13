import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MockNotificationGateway } from './gateways/mock-notification.gateway';
import { TermiiNotificationGateway } from './gateways/termii-notification.gateway';
import { NOTIFICATION_GATEWAY } from './interfaces/notification-gateway.interface';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [
    MockNotificationGateway,
    TermiiNotificationGateway,
    {
      provide: NOTIFICATION_GATEWAY,
      useFactory: (
        config: ConfigService,
        mockGateway: MockNotificationGateway,
        termiiGateway: TermiiNotificationGateway,
      ) => {
        // Equivalent to Spring Boot active profiles (@Profile("mock") vs @Profile("prod")):
        // 1. Explicit override via NOTIFICATION_MODE ('mock' | 'production' | 'termii')
        // 2. Or NODE_ENV ('production' -> TermiiNotificationGateway, otherwise -> MockNotificationGateway)
        const profile = (
          config.get<string>('NOTIFICATION_MODE') ||
          (config.get<string>('NODE_ENV') === 'production' ? 'production' : 'mock')
        ).toLowerCase();

        if (profile === 'production' || profile === 'live' || profile === 'termii') {
          return termiiGateway;
        }
        return mockGateway;
      },
      inject: [ConfigService, MockNotificationGateway, TermiiNotificationGateway],
    },
    NotificationsService,
  ],
  exports: [NotificationsService, NOTIFICATION_GATEWAY],
})
export class NotificationsModule {}
