import { prisma } from './src/lib/prisma';

async function main() {
  try {
    // Get the first workspace
    const workspace = await prisma.workspace.findFirst();
    if (!workspace) {
      console.log('❌ No workspace found');
      return;
    }
    console.log('✅ Found workspace:', workspace.id);

    // Create test jobs
    const jobs = await Promise.all([
      prisma.job.create({
        data: {
          workspaceId: workspace.id,
          type: 'SEND_EMAIL',
          payload: JSON.stringify({
            to: 'test@example.com',
            subject: 'Test Email from Job Queue',
            html: '<p>This is a test email from the job queue system</p>',
          }),
          status: 'PENDING',
          maxRetries: 3,
        },
      }),
      prisma.job.create({
        data: {
          workspaceId: workspace.id,
          type: 'WAIT',
          payload: JSON.stringify({ duration: 5000 }),
          status: 'PENDING',
          maxRetries: 1,
        },
      }),
      prisma.job.create({
        data: {
          workspaceId: workspace.id,
          type: 'SEND_EMAIL',
          payload: JSON.stringify({
            to: 'test2@example.com',
            subject: 'Follow-up Email',
            html: '<p>This is a follow-up message</p>',
          }),
          status: 'PENDING',
          maxRetries: 3,
        },
      }),
    ]);

    console.log('✅ Created 3 test jobs:');
    jobs.forEach((job, i) => {
      console.log(`  ${i + 1}. ${job.type} - ${job.id}`);
    });

    // Get job status
    const total = await prisma.job.count({ where: { workspaceId: workspace.id } });
    const pending = await prisma.job.count({
      where: { workspaceId: workspace.id, status: 'PENDING' },
    });
    console.log(`\n📊 Job Status: ${pending} pending / ${total} total`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
