import { Module } from '@nestjs/common';
import { RidersService } from './riders.service';
import { RidersController } from './riders.controller';
import { RiderPresenceService } from './rider-presence.service';
import { RiderPresenceScheduler } from './rider-presence.scheduler';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RidersController],
  providers: [
    RidersService,
    RiderPresenceService,
    RiderPresenceScheduler,
  ],
  exports: [
    RidersService,
    RiderPresenceService,
  ],
})
export class RidersModule {}
