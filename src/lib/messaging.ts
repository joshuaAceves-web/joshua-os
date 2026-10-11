import { prisma } from './prisma';
import { sendSMS } from './sms';

export async function sendMessage(
  workspaceId: string,
  contactId: string | null,
  phoneNumber: string,
  body: string,
  channel: 'sms' | 'whatsapp' = 'sms'
) {
  try {
    // Send via appropriate channel
    let result: any;
    let externalId: string | null = null;

    if (channel === 'sms') {
      result = await sendSMS({ to: phoneNumber, message: body });
      if (result.success) {
        externalId = result.messageId;
      }
    } else if (channel === 'whatsapp') {
      result = await sendWhatsAppMessage(workspaceId, phoneNumber, body);
      if (result.success) {
        externalId = result.messageId;
      }
    }

    if (!result.success) {
      throw new Error(result.error || 'Failed to send message');
    }

    // Get or create conversation
    const conversation = await prisma.conversation.upsert({
      where: {
        workspaceId_channel_phoneNumber: {
          workspaceId,
          channel,
          phoneNumber,
        },
      },
      update: { lastMessageAt: new Date() },
      create: {
        workspaceId,
        channel,
        phoneNumber,
        contactId,
        lastMessageAt: new Date(),
      },
    });

    // Create message record
    const message = await prisma.message.create({
      data: {
        workspaceId,
        channel,
        direction: 'outbound',
        body,
        phoneNumber,
        status: 'SENT',
        externalId,
        contactId: contactId || null,
        conversationId: conversation.id,
      },
    });

    return { success: true, messageId: message.id, externalId };
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendWhatsAppMessage(
  workspaceId: string,
  phoneNumber: string,
  message: string
) {
  try {
    const integration = await prisma.whatsappIntegration.findFirst({
      where: { workspaceId, isActive: true },
    });

    if (!integration) {
      return { success: false, error: 'WhatsApp not integrated' };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const url = `https://graph.instagram.com/v18.0/${integration.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${integration.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      return { success: false, error: data.error?.message || 'Failed to send WhatsApp' };
    }

    return { success: true, messageId: data.messages[0]?.id };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false, error: String(error) };
  }
}

export async function getConversation(workspaceId: string, conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 50 },
      contact: true,
    },
  });
}

export async function listConversations(workspaceId: string, status?: string) {
  return prisma.conversation.findMany({
    where: { workspaceId, ...(status && { status }) },
    include: {
      contact: true,
      messages: { take: 1, orderBy: { createdAt: 'desc' } },
    },
    orderBy: { lastMessageAt: 'desc' },
  });
}

export async function receiveMessage(
  workspaceId: string,
  channel: 'sms' | 'whatsapp',
  phoneNumber: string,
  body: string,
  externalId?: string,
  contactId?: string
) {
  try {
    // Get or create conversation
    const conversation = await prisma.conversation.upsert({
      where: {
        workspaceId_channel_phoneNumber: { workspaceId, channel, phoneNumber },
      },
      update: { lastMessageAt: new Date() },
      create: {
        workspaceId,
        channel,
        phoneNumber,
        contactId: contactId || null,
        lastMessageAt: new Date(),
      },
    });

    // Create message record
    const message = await prisma.message.create({
      data: {
        workspaceId,
        channel,
        direction: 'inbound',
        body,
        phoneNumber,
        status: 'DELIVERED',
        externalId: externalId || null,
        contactId: contactId || null,
        conversationId: conversation.id,
      },
    });

    return { success: true, messageId: message.id };
  } catch (error) {
    console.error('Receive message error:', error);
    return { success: false, error: String(error) };
  }
}
