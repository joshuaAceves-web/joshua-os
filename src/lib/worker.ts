import { prisma } from './prisma';
import { sendEmail } from './email';
import { sendSMS } from './sms';

export async function processJobs() {
  console.log('🔄 Starting job processor...');

  // Get pending and delayed jobs
  const now = new Date();
  const jobs = await prisma.job.findMany({
    where: {
      OR: [
        { status: 'PENDING' },
        { status: 'DELAYED', scheduledFor: { lte: now } },
      ],
    },
    take: 10, // Process 10 at a time
    orderBy: { createdAt: 'asc' },
  });

  if (jobs.length === 0) {
    return;
  }

  console.log(`📋 Processing ${jobs.length} jobs...`);

  for (const job of jobs) {
    try {
      await processJob(job);
    } catch (error) {
      console.error(`❌ Error processing job ${job.id}:`, error);
    }
  }
}

async function processJob(job: any) {
  // Mark as processing
  await prisma.job.update({
    where: { id: job.id },
    data: { status: 'PROCESSING' },
  });

  const payload = JSON.parse(job.payload);

  try {
    let result: any;

    switch (job.type) {
      case 'SEND_EMAIL':
        result = await sendEmail({
          to: payload.to,
          subject: payload.subject,
          html: payload.html,
        });
        break;

      case 'SEND_SMS':
        result = await sendSMS({
          to: payload.to,
          message: payload.message,
        });
        break;

      case 'WAIT':
        // Wait job - just mark as success
        result = { waited: true, duration: payload.duration };
        break;

      case 'EXECUTE_ACTION':
        // Generic action execution
        result = { executed: true, action: payload.action };
        break;

      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    // Mark as success
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: 'SUCCESS',
        result: JSON.stringify(result),
        processedAt: new Date(),
      },
    });

    console.log(`✅ Job ${job.id} completed`);
  } catch (error) {
    const errorMsg = String(error);

    // Check if we should retry
    if (job.retries < job.maxRetries) {
      // Retry later
      const delayMs = Math.pow(2, job.retries) * 5000; // exponential backoff
      const scheduledFor = new Date(Date.now() + delayMs);

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'DELAYED',
          error: errorMsg,
          retries: job.retries + 1,
          scheduledFor,
        },
      });

      console.log(
        `⏰ Job ${job.id} scheduled for retry in ${delayMs}ms`
      );
    } else {
      // Mark as failed
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          error: errorMsg,
          processedAt: new Date(),
        },
      });

      console.log(`❌ Job ${job.id} failed after ${job.maxRetries} retries`);
    }
  }
}

// Run continuously
export async function startWorker() {
  console.log('🚀 Worker started');

  setInterval(async () => {
    try {
      await processJobs();
    } catch (error) {
      console.error('Worker error:', error);
    }
  }, 5000); // Check every 5 seconds
}
