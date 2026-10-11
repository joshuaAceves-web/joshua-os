import { prisma } from './prisma';

export async function createInboxItemFromMessage(
  workspaceId: string,
  messageId: string,
  contactId: string | null,
  fromPhone: string,
  body: string,
  channel: string
) {
  try {
    const preview = body.substring(0, 100);

    const inboxItem = await prisma.inboxItem.create({
      data: {
        workspaceId,
        messageId,
        type: 'message',
        subject: `New ${channel.toUpperCase()} message`,
        preview,
        body,
        fromPhone,
        fromName: `Contact ${fromPhone}`,
        contactId: contactId || null,
        priority: 'NORMAL',
        labels: JSON.stringify(['message', channel]),
      },
    });

    return inboxItem;
  } catch (error) {
    console.error('Create inbox item error:', error);
    throw error;
  }
}

export async function createInboxItemFromSubmission(
  workspaceId: string,
  submissionId: string,
  contactId: string | null,
  data: Record<string, any>,
  formName: string
) {
  try {
    const preview = JSON.stringify(data).substring(0, 100);

    const inboxItem = await prisma.inboxItem.create({
      data: {
        workspaceId,
        submissionId,
        type: 'form_submission',
        subject: `New form: ${formName}`,
        preview,
        body: JSON.stringify(data, null, 2),
        fromEmail: data.email || null,
        fromName: data.firstName || 'Form Submission',
        contactId: contactId || null,
        priority: 'NORMAL',
        labels: JSON.stringify(['form', formName]),
      },
    });

    return inboxItem;
  } catch (error) {
    console.error('Create inbox item error:', error);
    throw error;
  }
}

export async function listInboxItems(
  workspaceId: string,
  options?: {
    unreadOnly?: boolean;
    type?: string;
    priority?: string;
    contactId?: string;
    limit?: number;
    offset?: number;
  }
) {
  const where: any = { workspaceId };

  if (options?.unreadOnly) where.isRead = false;
  if (options?.type) where.type = options.type;
  if (options?.priority) where.priority = options.priority;
  if (options?.contactId) where.contactId = options.contactId;

  const items = await prisma.inboxItem.findMany({
    where,
    include: { contact: true, message: true, submission: true },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  return items;
}

export async function markAsRead(itemId: string) {
  return prisma.inboxItem.update({
    where: { id: itemId },
    data: { isRead: true },
  });
}

export async function toggleFlag(itemId: string) {
  const item = await prisma.inboxItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Item not found');

  return prisma.inboxItem.update({
    where: { id: itemId },
    data: { isFlagged: !item.isFlagged },
  });
}

export async function addLabel(itemId: string, label: string) {
  const item = await prisma.inboxItem.findUnique({ where: { id: itemId } });
  if (!item) throw new Error('Item not found');

  const labels = JSON.parse(item.labels || '[]') as string[];
  if (!labels.includes(label)) {
    labels.push(label);
  }

  return prisma.inboxItem.update({
    where: { id: itemId },
    data: { labels: JSON.stringify(labels) },
  });
}

export async function getInboxStats(workspaceId: string) {
  const [total, unread, flagged, messages, forms, activities] = await Promise.all([
    prisma.inboxItem.count({ where: { workspaceId } }),
    prisma.inboxItem.count({ where: { workspaceId, isRead: false } }),
    prisma.inboxItem.count({ where: { workspaceId, isFlagged: true } }),
    prisma.inboxItem.count({ where: { workspaceId, type: 'message' } }),
    prisma.inboxItem.count({ where: { workspaceId, type: 'form_submission' } }),
    prisma.inboxItem.count({ where: { workspaceId, type: 'activity' } }),
  ]);

  return { total, unread, flagged, messages, forms, activities };
}

export async function searchInbox(workspaceId: string, query: string) {
  return prisma.inboxItem.findMany({
    where: {
      workspaceId,
      OR: [
        { body: { contains: query, mode: 'insensitive' } },
        { subject: { contains: query, mode: 'insensitive' } },
        { fromName: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: { contact: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
