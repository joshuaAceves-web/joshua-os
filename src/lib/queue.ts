import { prisma } from './prisma';

export interface JobPayload {
  [key: string]: any;
}

export async function enqueueJob(
  workspaceId: string,
  type: string,
  payload: JobPayload,
  options?: {
    delayMs?: number;
    maxRetries?: number;
    automationRunId?: string;
  }
) {
  const scheduledFor = options?.delayMs
    ? new Date(Date.now() + options.delayMs)
    : null;

  const job = await prisma.job.create({
    data: {
      workspaceId,
      type,
      payload: JSON.stringify(payload),
      status: scheduledFor ? 'DELAYED' : 'PENDING',
      scheduledFor,
      maxRetries: options?.maxRetries || 3,
      automationRunId: options?.automationRunId,
    },
  });

  return job;
}

// Helper functions for common jobs

export async function enqueueSendEmail(
  workspaceId: string,
  to: string,
  subject: string,
  html: string,
  options?: any
) {
  return enqueueJob(
    workspaceId,
    'SEND_EMAIL',
    { to, subject, html },
    options
  );
}

export async function enqueueSendSMS(
  workspaceId: string,
  to: string,
  message: string,
  options?: any
) {
  return enqueueJob(
    workspaceId,
    'SEND_SMS',
    { to, message },
    options
  );
}

export async function enqueueWait(
  workspaceId: string,
  duration: number, // milliseconds
  options?: any
) {
  return enqueueJob(
    workspaceId,
    'WAIT',
    { duration },
    { delayMs: duration, ...options }
  );
}

export async function getJobStatus(jobId: string) {
  return prisma.job.findUnique({
    where: { id: jobId },
  });
}

export async function getJobsStatus(workspaceId: string) {
  const total = await prisma.job.count({ where: { workspaceId } });
  const pending = await prisma.job.count({
    where: { workspaceId, status: 'PENDING' },
  });
  const delayed = await prisma.job.count({
    where: { workspaceId, status: 'DELAYED' },
  });
  const processing = await prisma.job.count({
    where: { workspaceId, status: 'PROCESSING' },
  });
  const success = await prisma.job.count({
    where: { workspaceId, status: 'SUCCESS' },
  });
  const failed = await prisma.job.count({
    where: { workspaceId, status: 'FAILED' },
  });

  return { total, pending, delayed, processing, success, failed };
}
