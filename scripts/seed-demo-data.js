const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const companies = [
  { name: 'Tech Innovations LLC', email: 'admin@techinnovations.com' },
  { name: 'Marketing Pro Agency', email: 'admin@marketingpro.com' },
  { name: 'Sales Masters Inc', email: 'admin@salesmasters.com' },
  { name: 'Digital Growth Studio', email: 'admin@digitalgrowth.com' },
  { name: 'B2B Solutions Co', email: 'admin@b2bsolutions.com' },
];

const firstNames = ['John', 'Sarah', 'Michael', 'Jessica', 'David', 'Emily', 'Robert', 'Lisa'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
const companies_names = ['Acme Corp', 'TechStart', 'GrowthCo', 'Innovation Labs', 'Digital Pro'];

async function main() {
  console.log('🌱 Creating demo data...');

  for (const company of companies) {
    try {
      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: company.name,
          slug: company.name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substr(2, 5),
          settings: {
            create: {
              companyName: company.name,
              primaryColor: ['#2563eb', '#dc2626', '#059669', '#7c3aed', '#f59e0b'][Math.floor(Math.random() * 5)],
              supportEmail: company.email,
            },
          },
        },
      });

      console.log(`✅ Created workspace: ${company.name}`);

      // Create admin user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: company.email,
          password: hashedPassword,
          name: company.name + ' Admin',
          role: 'admin',
          workspaceId: workspace.id,
        },
      });

      // Create contacts
      const contacts = [];
      for (let i = 0; i < 20; i++) {
        const contact = await prisma.contact.create({
          data: {
            firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
            lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
            email: `contact${i}@${companies_names[i % companies_names.length].toLowerCase()}.com`,
            phone: `+1 555 ${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
            businessName: companies_names[Math.floor(Math.random() * companies_names.length)],
            source: ['Website', 'Referral', 'LinkedIn', 'Email', 'Phone'][Math.floor(Math.random() * 5)],
            status: ['NEW', 'CONTACTED', 'QUALIFIED', 'NURTURE', 'CLOSED'][Math.floor(Math.random() * 5)],
            workspaceId: workspace.id,
          },
        });
        contacts.push(contact);
      }

      // Create opportunities
      const stages = ['NEW_LEAD', 'CONTACTED', 'MEETING', 'PROPOSAL', 'WON', 'LOST'];
      for (let i = 0; i < 25; i++) {
        const value = Math.floor(Math.random() * 100000) + 5000;
        await prisma.opportunity.create({
          data: {
            name: `Deal - ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            estimatedValue: value,
            stage: stages[Math.floor(Math.random() * stages.length)],
            status: Math.random() > 0.6 ? 'OPEN' : ['WON', 'LOST'][Math.floor(Math.random() * 2)],
            contactId: contacts[Math.floor(Math.random() * contacts.length)].id,
            workspaceId: workspace.id,
          },
        });
      }

      // Create inbox items
      for (let i = 0; i < 15; i++) {
        await prisma.inboxItem.create({
          data: {
            type: ['message', 'form_submission', 'activity'][Math.floor(Math.random() * 3)],
            subject: `New Lead from ${companies_names[Math.floor(Math.random() * companies_names.length)]}`,
            preview: 'Interested in our services...',
            body: 'This is a lead from our website. They are interested in our services and want more information.',
            fromName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
            fromEmail: `lead${i}@example.com`,
            priority: ['NORMAL', 'HIGH', 'URGENT'][Math.floor(Math.random() * 3)],
            isRead: Math.random() > 0.3,
            isFlagged: Math.random() > 0.8,
            workspaceId: workspace.id,
          },
        });
      }

      console.log(`  ✓ Added 20 contacts, 25 deals, 15 inbox items`);
    } catch (error) {
      console.error(`❌ Error for ${company.name}:`, error.message);
    }
  }

  console.log('\n✅ Demo data created successfully!');
  console.log('\n📝 Login with:');
  companies.forEach((c) => {
    console.log(`   ${c.email} / password123`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
