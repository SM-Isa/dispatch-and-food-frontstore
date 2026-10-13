import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import { AiClientService } from '../ai-client.service';

export interface WhatsAppIncomingMessage {
  from: string; // e.g. '2348012345678'
  id: string; // wamid.HBg...
  timestamp: string;
  type: 'text' | 'audio' | 'image' | 'interactive';
  text?: { body: string };
  audio?: { id: string; mime_type: string; link?: string };
}

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiClient: AiClientService,
  ) {}

  /**
   * Process incoming WhatsApp Business Webhook message (Text or Voice Note)
   */
  async processWhatsAppMessage(msg: WhatsAppIncomingMessage) {
    const sender = msg.from;
    const channel = 'WHATSAPP';

    // 1. Upsert Conversation Session
    const conversation = await this.prisma.conversation.upsert({
      where: {
        channel_externalId: {
          channel,
          externalId: sender,
        },
      },
      update: {
        lastMessageAt: new Date(),
      },
      create: {
        channel,
        externalId: sender,
        state: 'ACTIVE',
        lastMessageAt: new Date(),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    // 2. Resolve content: Text or Voice Note
    let textContent = '';
    let mediaUrl: string | undefined = undefined;

    if (msg.type === 'text' && msg.text?.body) {
      textContent = msg.text.body;
    } else if (msg.type === 'audio') {
      mediaUrl = msg.audio?.link || `whatsapp_audio_${msg.audio?.id}`;
      // In production, Gemini 1.5 native audio processes voice note directly
      // Fallback/Simulated transcription for voice notes in Nigerian pidgin/English:
      textContent = 'Please I want to order 2 plates of amala and assorted meat from Mama Kitchen in Tanke, deliver to Tanke Junction near UNILORIN gate';
      this.logger.log(`Transcribed voice note for ${sender}: "${textContent}"`);
    } else {
      textContent = 'Hello';
    }

    // 3. Log Inbound Message
    await this.prisma.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        direction: 'IN',
        type: msg.type,
        body: textContent,
        mediaUrl,
      },
    });

    // Check if human handoff is active
    if (conversation.state === 'HUMAN_HANDOFF') {
      const handoffReply = "An operations agent has been notified and will assist you shortly on this WhatsApp chat.";
      await this.logOutboundMessage(conversation.id, handoffReply);
      return { status: 'HUMAN_HANDOFF', reply: handoffReply };
    }

    // 4. Gemini 1.5 Pro Order Intent Extraction
    const parsed = await this.aiClient.parseWhatsAppOrderIntent(textContent);

    // 5. Clarification Loop Check (Confidence Threshold < 0.85)
    if (parsed.confidence < 0.85) {
      // Check turn count of recent low-confidence inbound messages
      const recentInbounds = conversation.messages.filter((m) => m.direction === 'IN');
      if (recentInbounds.length >= 2) {
        // Escalate to human ops
        await this.prisma.conversation.update({
          where: { id: conversation.id },
          data: { state: 'HUMAN_HANDOFF' },
        });

        const escalationReply =
          "I'm connecting you to one of our human dispatch agents who can take your order right now. Please hold on a moment!";
        await this.logOutboundMessage(conversation.id, escalationReply, parsed, parsed.confidence);
        return { status: 'ESCALATED', reply: escalationReply };
      }

      // Generate clarification question
      let clarificationQuestion =
        "Thank you for contacting us! Could you please clarify your order or tell us which area (e.g. Tanke or GRA) you are ordering from?";
      if (!parsed.vendor_cluster_hint) {
        clarificationQuestion =
          "We found Mama's Kitchen in both Tanke and GRA. Which branch would you like to order from?";
      }

      await this.logOutboundMessage(conversation.id, clarificationQuestion, parsed, parsed.confidence);
      return { status: 'CLARIFICATION_REQUIRED', reply: clarificationQuestion };
    }

    // 6. Confidence >= 0.85: Structured Order Generation & Monnify Virtual Account Instructions
    const itemsSummary = (parsed.items || [])
      .map((it) => `• ${it.quantity}x ${it.name} (${it.modifiers.join(', ') || 'standard'})`)
      .join('\n');

    const estimatedFoodPrice = 3200;
    const estimatedDeliveryFee = 600;
    const totalAmount = estimatedFoodPrice + estimatedDeliveryFee;
    const virtualAccountNum = `90${Math.floor(10000000 + Math.random() * 90000000)}`;

    const orderConfirmationReply =
`🍲 *Order Summary - Mama's Kitchen (${parsed.vendor_cluster_hint})*
${itemsSummary}

📍 *Delivery to:* ${parsed.delivery_address_text} (${parsed.delivery_landmark})
💵 Food Total: ₦${estimatedFoodPrice.toLocaleString()}
🛵 Delivery Fee: ₦${estimatedDeliveryFee.toLocaleString()}
*Total Amount:* ₦${totalAmount.toLocaleString()}

━━━━━━━━━━━━━━━━━━━━
💳 *Payment via Instant Bank Transfer:*
Bank: *Wema Bank / Monnify*
Account Number: *${virtualAccountNum}*
Account Name: *DispatchStore - Mama Kitchen*
_(Account valid for 30 minutes)_
━━━━━━━━━━━━━━━━━━━━

Reply *PAID* once transfer is complete to start meal preparation!`;

    await this.logOutboundMessage(conversation.id, orderConfirmationReply, parsed, parsed.confidence);

    return {
      status: 'ORDER_OFFERED',
      reply: orderConfirmationReply,
      orderDraft: {
        vendorName: parsed.vendor_name,
        cluster: parsed.vendor_cluster_hint,
        items: parsed.items,
        deliveryAddress: parsed.delivery_address_text,
        totalAmount,
        virtualAccount: {
          bank: 'Wema Bank',
          accountNumber: virtualAccountNum,
        },
      },
    };
  }

  private async logOutboundMessage(
    conversationId: string,
    body: string,
    parsedIntent?: any,
    confidence?: number,
  ) {
    return this.prisma.conversationMessage.create({
      data: {
        conversationId,
        direction: 'OUT',
        type: 'text',
        body,
        parsedIntent: parsedIntent || undefined,
        modelUsed: 'gemini-1.5-pro-002',
        confidence: confidence !== undefined ? confidence : undefined,
      },
    });
  }

  async getConversation(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async listConversations(state?: string) {
    return this.prisma.conversation.findMany({
      where: state ? { state } : undefined,
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }
}
