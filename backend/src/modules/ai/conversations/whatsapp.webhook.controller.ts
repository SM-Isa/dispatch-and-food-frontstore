import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationsService } from './conversations.service';

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly conversationsService: ConversationsService,
  ) {}

  /**
   * Meta Webhook Verification Handshake
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expectedToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN', 'dispatch_verify_secret');
    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log('WhatsApp Webhook successfully verified');
      return challenge;
    }
    throw new ForbiddenException('Invalid verify token');
  }

  /**
   * Receive incoming messages from WhatsApp Cloud API
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleInbound(@Body() payload: any) {
    try {
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];

      if (!message) {
        // May be a delivery status update (sent/delivered/read)
        return { status: 'IGNORED_NON_MESSAGE' };
      }

      const result = await this.conversationsService.processWhatsAppMessage({
        from: message.from,
        id: message.id,
        timestamp: message.timestamp,
        type: message.type,
        text: message.text,
        audio: message.audio,
      });

      return { status: 'SUCCESS', result };
    } catch (err) {
      this.logger.error(`Error processing WhatsApp webhook: ${(err as Error).message}`);
      return { status: 'ERROR', error: (err as Error).message };
    }
  }

  @Get('conversations')
  async listConversations(@Query('state') state?: string) {
    return this.conversationsService.listConversations(state);
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    return this.conversationsService.getConversation(id);
  }
}
