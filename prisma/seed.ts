import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

// Helper function to extract variables from text
function extractVariables(texts: string[]): string[] {
  const variables = new Set<string>();
  const pattern = /\{\{(\w+)\}\}/g;

  for (const text of texts) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      variables.add(match[1]);
    }
  }

  return Array.from(variables).sort();
}

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.automationStep.deleteMany();
  await prisma.automationRun.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.projectTemplate.deleteMany();
  await prisma.formSubmission.deleteMany();
  await prisma.form.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Joshua Studio',
      slug: 'joshua-studio',
    },
  });

  console.log('✅ Workspace created:', workspace.name);

  // Create admin user
  const hashedPassword = await hash('admin123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'admin@joshua.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin',
      workspaceId: workspace.id,
    },
  });

  console.log('✅ Admin user created:', user.email);

  // Create project templates
  const templates = await Promise.all([
    prisma.projectTemplate.create({
      data: {
        name: 'Website',
        description: 'Website design and development project',
        tasks: JSON.stringify([
          'Discovery',
          'Collect Assets',
          'Sitemap / Structure',
          'Copy',
          'Design',
          'Development',
          'Mobile QA',
          'Integrations',
          'Final Review',
          'Launch',
        ]),
      },
    }),
    prisma.projectTemplate.create({
      data: {
        name: 'Branding',
        description: 'Branding and identity project',
        tasks: JSON.stringify([
          'Discovery',
          'Brand Strategy',
          'Creative Directions',
          'Logo Concepts',
          'Revision',
          'Final Identity',
          'Brand Guide',
          'Delivery',
        ]),
      },
    }),
    prisma.projectTemplate.create({
      data: {
        name: 'Automation',
        description: 'Automation workflow setup',
        tasks: JSON.stringify([
          'Discovery',
          'Workflow Mapping',
          'Integration Setup',
          'Automation Build',
          'Testing',
          'Client Review',
          'Launch',
          'Monitoring',
        ]),
      },
    }),
  ]);

  console.log('✅ Project templates created:', templates.length);

  // Create sample contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'Juan',
        lastName: 'García',
        email: 'juan@taller.com',
        phone: '+52 123 456 7890',
        businessName: 'Taller Mendoza',
        service: 'Website',
        source: 'Referral',
        workspaceId: workspace.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'María',
        lastName: 'López',
        email: 'maria@brand.com',
        phone: '+52 098 765 4321',
        businessName: 'Brand Agency',
        service: 'Branding',
        source: 'Direct',
        workspaceId: workspace.id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Carlos',
        lastName: 'Rodríguez',
        email: 'carlos@store.com',
        phone: '+52 555 123 4567',
        businessName: 'Online Store',
        service: 'Website',
        source: 'WhatsApp',
        workspaceId: workspace.id,
      },
    }),
  ]);

  console.log('✅ Sample contacts created:', contacts.length);

  // Create opportunities
  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        name: 'Taller Mendoza - Website',
        estimatedValue: 8000,
        stage: 'NEW_LEAD',
        status: 'OPEN',
        contactId: contacts[0].id,
        workspaceId: workspace.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        name: 'Brand Agency - Branding',
        estimatedValue: 5000,
        stage: 'MEETING',
        status: 'OPEN',
        contactId: contacts[1].id,
        workspaceId: workspace.id,
      },
    }),
    prisma.opportunity.create({
      data: {
        name: 'Online Store - Website',
        estimatedValue: 6500,
        stage: 'PROPOSAL',
        status: 'OPEN',
        contactId: contacts[2].id,
        workspaceId: workspace.id,
      },
    }),
  ]);

  console.log('✅ Opportunities created:', opportunities.length);

  // Create a project from a won opportunity
  const project = await prisma.project.create({
    data: {
      name: 'Brand Agency - Branding Project',
      service: 'Branding',
      status: 'IN_PROGRESS',
      startDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      contactId: contacts[1].id,
      workspaceId: workspace.id,
      templateId: templates[1].id, // Branding template
    },
  });

  console.log('✅ Project created:', project.name);

  // Create tasks from template
  const templateTasks = JSON.parse(templates[1].tasks);
  const tasks = await Promise.all(
    templateTasks.map((taskName: string, index: number) =>
      prisma.task.create({
        data: {
          title: taskName,
          status: index < 2 ? 'DONE' : 'TODO',
          priority: 'MEDIUM',
          projectId: project.id,
          workspaceId: workspace.id,
          completedAt: index < 2 ? new Date() : null,
        },
      })
    )
  );

  console.log('✅ Tasks created:', tasks.length);

  // Create email templates
  const emailTemplates = await Promise.all([
    (async () => {
      const subject = 'Welcome to {{businessName}} 👋';
      const html = `
        <h1>Hi {{firstName}},</h1>
        <p>Thank you for your interest in our services!</p>
        <p>We're excited to work with you on {{service}} projects.</p>
        <p>Our team will be in touch shortly.</p>
        <p>Best regards,<br/>The Team</p>
      `;
      const plainText = 'Hi {{firstName}}, thank you for your interest!';
      const variables = extractVariables([subject, html, plainText]);

      return prisma.emailTemplate.create({
        data: {
          name: 'Welcome Email',
          slug: 'welcome-email',
          description: 'Welcome email for new leads',
          subject,
          html,
          plainText,
          variables: JSON.stringify(variables),
          category: 'welcome',
          workspaceId: workspace.id,
        },
      });
    })(),
    (async () => {
      const subject = 'Following up on {{businessName}}';
      const html = `
        <h1>Hi {{firstName}},</h1>
        <p>Just checking in on {{businessName}}.</p>
        <p>We'd love to discuss how we can help with {{service}}.</p>
        <p>Are you available for a quick call this week?</p>
        <p>Best regards,<br/>The Team</p>
      `;
      const variables = extractVariables([subject, html]);

      return prisma.emailTemplate.create({
        data: {
          name: 'Follow-up Email',
          slug: 'follow-up-email',
          description: 'Follow-up email after initial contact',
          subject,
          html,
          plainText: null,
          variables: JSON.stringify(variables),
          category: 'follow_up',
          workspaceId: workspace.id,
        },
      });
    })(),
    (async () => {
      const subject = 'Your {{service}} proposal is ready';
      const html = `
        <h1>Hi {{firstName}},</h1>
        <p>We've prepared a custom proposal for {{businessName}}.</p>
        <p>Please review and let us know if you have any questions.</p>
        <p>We're here to help!</p>
        <p>Best regards,<br/>The Team</p>
      `;
      const variables = extractVariables([subject, html]);

      return prisma.emailTemplate.create({
        data: {
          name: 'Proposal Sent',
          slug: 'proposal-sent',
          description: 'Email sent when proposal is delivered',
          subject,
          html,
          plainText: null,
          variables: JSON.stringify(variables),
          category: 'proposal',
          workspaceId: workspace.id,
        },
      });
    })(),
  ]);

  console.log('✅ Email templates created:', emailTemplates.length);

  // Create a form
  const form = await prisma.form.create({
    data: {
      name: 'Lead Capture',
      slug: 'lead-capture',
      description: 'Capture new leads from website',
      isActive: true,
      fields: JSON.stringify([
        { name: 'firstName', label: 'First Name', type: 'text', required: true },
        { name: 'lastName', label: 'Last Name', type: 'text', required: false },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'phone', label: 'Phone', type: 'tel', required: false },
        { name: 'businessName', label: 'Business Name', type: 'text', required: false },
        { name: 'service', label: 'Service Interested', type: 'select', required: true },
      ]),
      workspaceId: workspace.id,
    },
  });

  console.log('✅ Form created:', form.slug);

  // Create an automation
  const automation = await prisma.automation.create({
    data: {
      name: 'New Lead Auto-Response',
      description: 'Automatically create task for new form submissions',
      isActive: true,
      trigger: 'form.submitted',
      triggerConfig: JSON.stringify({ formId: form.id }),
      actions: JSON.stringify([
        {
          type: 'CREATE_TASK',
          config: { title: 'Follow up with {{contact.firstName}}', priority: 'HIGH' },
        },
        {
          type: 'CREATE_NOTIFICATION',
          config: { message: 'New lead: {{contact.firstName}} - {{contact.businessName}}' },
        },
      ]),
      workspaceId: workspace.id,
      formId: form.id,
    },
  });

  console.log('✅ Automation created:', automation.name);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
