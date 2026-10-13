import { Module } from '@nestjs/common';
import { DispatchService } from './dispatch.service';
import { DispatchController } from './dispatch.controller';
import { DispatchEngine } from './dispatch.engine';
import { OffersService } from './offers.service';
import { OfferLockService } from './offer-lock.service';
import { CandidateQueryService } from './candidate-query.service';
import { DispatchScorer } from './dispatch.scorer';
import { DispatchRepository } from './dispatch.repository';
import { DispatchEmitter } from './events/dispatch-emitter.service';
import { RidersModule } from '../riders/riders.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [RidersModule, AuthModule, PrismaModule, AiModule],
  controllers: [DispatchController],
  providers: [
    DispatchService,
    DispatchEngine,
    OffersService,
    OfferLockService,
    CandidateQueryService,
    DispatchScorer,
    DispatchRepository,
    DispatchEmitter,
  ],
  exports: [
    DispatchService,
    DispatchEngine,
    OffersService,
  ],
})
export class DispatchModule {}
