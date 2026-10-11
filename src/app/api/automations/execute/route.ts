import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enqueueJob, enqueueSendEmail, enqueueSendSMS, enqueueWait } from '@/lib/queue';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { automationId, contactId, opportunityId, data } = body;
    const workspaceId = (session.user as any).workspaceId;

    // Get automation
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
    });

    if (!automation || !automation.isActive) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Get contact info
    const contact = contactId
      ? await prisma.contact.findUnique({ where: { id: contactId } })
      : null;

    // Create automation run
    const run = await prisma.automationRun.create({
      data: {
        automationId,
        workspaceId,
        contactId: contactId || null,
        opportunityId: opportunityId || null,
        status: 'RUNNING',
        correlationId: `run_${Date.now()}`,
      },
    });

    // Parse actions and enqueue jobs
    const actions = JSON.parse(automation.actions);
    let stepResults = [];
    let currentDelay = 0;

    for (const action of actions) {
      try {
        if (action.type === 'SEND_EMAIL' && contact?.email) {
          const subject = action.config.subject
            .replace('{{contact.firstName}}', contact.firstName || '')
            .replace('{{contact.businessName}}', contact.businessName || '');

          const html = action.config.html
            .replace('{{contact.firstName}}', contact.firstName || '')
            .replace('{{contact.businessName}}', contact.businessName || '');

          const job = await enqueueSendEmail(
            workspaceId,
            contact.email,
            subject,
            html,
            { delayMs: currentDelay, automationRunId: run.id }
          );

          await prisma.automationStep.create({
            data: {
              runId: run.id,
              actionType: action.type,
              status: 'QUEUED',
              result: JSON.stringify({ jobId: job.id }),
            },
          });

          stepResults.push({ action: action.type, success: true, jobId: job.id });
        } else if (action.type === 'SEND_SMS' && contact?.phone) {
          const message = action.config.message
            .replace('{{contact.firstName}}', contact.firstName || '')
            .replace('{{contact.businessName}}', contact.businessName || '');

          const job = await enqueueSendSMS(
            workspaceId,
            contact.phone,
            message,
            { delayMs: currentDelay, automationRunId: run.id }
          );

          await prisma.automationStep.create({
            data: {
              runId: run.id,
              actionType: action.type,
              status: 'QUEUED',
              result: JSON.stringify({ jobId: job.id }),
            },
          });

          stepResults.push({ action: action.type, success: true, jobId: job.id });
        } else if (action.type === 'WAIT') {
          const duration = action.config.duration || 60000; // Default 1 minute
          const job = await enqueueWait(
            workspaceId,
            duration,
            { automationRunId: run.id }
          );
          currentDelay += duration;

          await prisma.automationStep.create({
            data: {
              runId: run.id,
              actionType: action.type,
              status: 'QUEUED',
              result: JSON.stringify({ jobId: job.id, duration }),
            },
          });

          stepResults.push({ action: action.type, success: true, jobId: job.id, duration });
        } else if (action.type === 'CREATE_TASK') {
          const task = await prisma.task.create({
            data: {
              title: `Follow up: ${contact?.firstName || 'Lead'}`,
              status: 'TODO',
              priority: 'HIGH',
              workspaceId,
            },
          });

          await prisma.automationStep.create({
            data: {
              runId: run.id,
              actionType: action.type,
              status: 'SUCCESS',
              result: JSON.stringify({ taskId: task.id }),
            },
          });

          stepResults.push({ action: action.type, success: true, taskId: task.id });
        } else if (action.type === 'CREATE_NOTIFICATION') {
          const notification = await prisma.notification.create({
            data: {
              title: 'Automation Action',
              message: action.config.message || 'Action executed',
              workspaceId,
            },
          });

          await prisma.automationStep.create({
            data: {
              runId: run.id,
              actionType: action.type,
              status: 'SUCCESS',
              result: JSON.stringify({ notificationId: notification.id }),
            },
          });

          stepResults.push({ action: action.type, success: true, notificationId: notification.id });
        }
      } catch (error) {
        await prisma.automationStep.create({
          data: {
            runId: run.id,
            actionType: action.type,
            status: 'FAILED',
            error: String(error),
          },
        });

        stepResults.push({ action: action.type, success: false, error: String(error) });
      }
    }

    // Update run status - jobs are queued
    await prisma.automationRun.update({
      where: { id: run.id },
      data: { status: 'QUEUED' },
    });

    return NextResponse.json({
      success: true,
      runId: run.id,
      steps: stepResults,
    });
  } catch (error) {
    console.error('Execute automation error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
