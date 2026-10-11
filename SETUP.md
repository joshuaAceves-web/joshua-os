# Joshua OS - Setup Guide

## Project Overview

Joshua OS is a fully functional business management system combining CRM, Sales Pipeline, Project Management, and Automation - all in one unified platform.

**Status**: Phase 1-4 Complete ✅

## What's Built

### ✅ Phase 1: Foundation
- NextAuth.js authentication system
- User roles and workspace management
- Protected routes and layouts
- Database schema with Prisma

### ✅ Phase 2: CRM + Pipeline
- Full Contacts management (Create, Read, Update, Delete)
- Search and filtering capabilities
- Sales Pipeline with 6 stages: New Lead → Contacted → Meeting → Proposal → Won/Lost
- Opportunities tracking with estimated values
- Activity timeline logging

### ✅ Phase 3: Projects + Tasks
- Project management with 5 statuses
- Task management with priority levels
- 3 Pre-built project templates (Website, Branding, Automation)
- Task progress tracking
- Automatic template task generation

### ✅ Phase 4: Dashboard + Forms + Automation
- Comprehensive dashboard with 8 KPI metrics
- Form builder and form submissions
- Form submission handler that auto-creates contacts/opportunities
- Automation engine V1 with:
  - 7 trigger types (form.submitted, contact.created, etc.)
  - 6 action types (CREATE_TASK, CREATE_NOTIFICATION, etc.)
  - Automation run history
  - Loop protection (MAX_DEPTH = 5)
  - Error handling

## File Structure

```
joshua-os-app/
├── src/
│   ├── app/
│   │   ├── (app)/              # Protected routes with sidebar
│   │   │   ├── dashboard/      # KPI dashboard
│   │   │   ├── contacts/       # Contacts list & detail
│   │   │   ├── pipeline/       # Kanban pipeline view
│   │   │   ├── projects/       # Projects management
│   │   │   ├── tasks/          # Task management
│   │   │   ├── forms/          # Form builder
│   │   │   ├── automations/    # Automation rules
│   │   │   └── settings/       # Workspace settings
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth routes
│   │   │   ├── dashboard/      # Dashboard metrics
│   │   │   ├── contacts/       # Contact CRUD
│   │   │   ├── opportunities/  # Opportunity CRUD
│   │   │   ├── projects/       # Project CRUD
│   │   │   └── tasks/          # Task CRUD
│   │   ├── auth/login/         # Login page
│   │   └── layout.tsx          # Root layout with SessionProvider
│   ├── lib/
│   │   ├── auth.ts             # NextAuth configuration
│   │   └── prisma.ts           # Prisma client singleton
│   └── components/
│       └── Sidebar.tsx          # Navigation sidebar
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data script
├── .env.local                  # Environment variables
├── package.json
└── README.md
```

## Database Schema

Complete schema with 15 tables:
- **Auth**: Workspace, User
- **CRM**: Contact, Opportunity
- **Projects**: Project, ProjectTemplate, Task
- **Forms**: Form, FormSubmission
- **Automation**: Automation, AutomationRun, AutomationStep
- **Logs**: Activity, Notification

## Setup Instructions

### Step 1: Database Setup

Choose one option:

#### Option A: Local PostgreSQL
```bash
# Create database
createdb joshua_os

# Update .env.local
DATABASE_URL="postgresql://username:password@localhost:5432/joshua_os"
DIRECT_URL="postgresql://username:password@localhost:5432/joshua_os"
```

#### Option B: Neon (Cloud)
1. Sign up at https://neon.tech
2. Create a project
3. Copy the connection string from Neon console
4. Update `.env.local`:
```
DATABASE_URL="postgresql://user:password@neon.tech/dbname"
DIRECT_URL="postgresql://user:password@neon.tech/dbname"
```

#### Option C: Docker (Optional)
```bash
docker run -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15
```

### Step 2: Update Environment Variables

Edit `.env.local`:
```env
DATABASE_URL="your_connection_string_here"
DIRECT_URL="your_connection_string_here"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### Step 3: Initialize Database

```bash
# Push schema to database
npm run db:push

# Populate seed data
npm run db:seed
```

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 5: Login

Use demo credentials:
- **Email**: admin@joshua.com
- **Password**: admin123

## Seed Data Included

The seed script creates:
- 1 workspace: "Joshua Studio"
- 1 admin user
- 3 project templates (Website, Branding, Automation)
- 3 sample contacts
- 3 sample opportunities
- 1 sample project with 8 tasks
- 1 lead capture form
- 1 automation rule

## Testing the Features

### Test Contacts
1. Go to Contacts
2. Click "New Contact"
3. Create a contact

### Test Pipeline
1. Go to Pipeline
2. View 6 pipeline stages with opportunities
3. See pipeline value calculation

### Test Projects
1. Go to Projects
2. Click a project to see its tasks
3. Check progress percentage

### Test Dashboard
1. Go to Dashboard
2. See all 8 KPI metrics populated
3. View quick action buttons

## Troubleshooting

### Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct

### Seed Failed
```bash
# Reset and retry
npm run db:push
npm run db:seed
```

### Port Already in Use
```bash
# Use different port
npm run dev -- -p 3001
```

### NEXTAUTH_SECRET Error
Regenerate in `.env.local`:
```bash
# Linux/Mac
openssl rand -base64 32
# Or just use any random string
```

## Next Steps (Phase 5+)

The architecture is ready for:
- Phase 5: Queue + Worker + Durable Automations
- Phase 6: Email Integration
- Phase 7: Google Calendar + Booking
- Phase 8: WhatsApp Integration
- Phase 9: Unified Inbox
- Phase 10: Advanced Permissions + Polish

## API Endpoints Reference

### Authentication
- POST `/api/auth/signin` - Login
- GET `/api/auth/session` - Get current session

### Contacts
- GET `/api/contacts?search=...` - List contacts
- POST `/api/contacts` - Create contact

### Opportunities
- GET `/api/opportunities?stage=...&status=...` - List opportunities
- POST `/api/opportunities` - Create opportunity

### Projects
- GET `/api/projects` - List projects
- POST `/api/projects` - Create project

### Tasks
- GET `/api/tasks?view=today|upcoming|overdue|completed` - List tasks
- POST `/api/tasks` - Create task

### Dashboard
- GET `/api/dashboard/metrics` - Get all KPI metrics

## Deployment

Ready for deployment to:
- Vercel (recommended)
- Railway
- Render
- AWS
- DigitalOcean
- Any Node.js hosting

Ensure to:
1. Use production database (Neon recommended)
2. Set `NODE_ENV=production`
3. Configure real `NEXTAUTH_SECRET`
4. Set `NEXTAUTH_URL` to your domain

## Performance Notes

- Optimistic UI updates for contacts/opportunities
- Efficient Prisma queries with includes
- Activity logging for all major events
- Session caching with JWT

## Support & Questions

Refer to:
- Prisma docs: https://www.prisma.io/docs
- NextAuth docs: https://next-auth.js.org
- Next.js docs: https://nextjs.org/docs

---

**Status**: Phase 1-4 Complete ✅ | Ready for Phase 5
**Built**: October 2026
**Tech**: Next.js 16, React 19, TypeScript, PostgreSQL, Prisma, NextAuth
