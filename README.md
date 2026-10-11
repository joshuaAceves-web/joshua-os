# Joshua OS - Business Management System

A comprehensive business management system built with Next.js, featuring CRM, Sales Pipeline, Project Management, Task Tracking, Forms, and Automation.

## Quick Start

1. **Set up database** (PostgreSQL or Neon):
   - Update `DATABASE_URL` in `.env.local`

2. **Install & Setup**:
   ```bash
   npm install
   npm run db:push
   npm run db:seed
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Login with demo credentials**:
   - Email: `admin@joshua.com`
   - Password: `admin123`

## Features (Phase 1-4 Complete + Email/SMS/Tracking)
- ✅ Authentication & Workspace Management
- ✅ Contacts & Opportunities
- ✅ Sales Pipeline with 6 stages
- ✅ Projects & Tasks with templates
- ✅ Dashboard with KPIs
- ✅ Lead capture forms
- ✅ Automation engine
- ✅ Email Sending (Resend)
- ✅ SMS Sending (Twilio)
- ✅ Visitor Tracking (IP, Email, Pages)

## Setup Email & SMS

### Email (Resend)
1. Sign up at https://resend.com
2. Get your API key
3. Add to `.env.local`:
```
RESEND_API_KEY="your-api-key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
```

### SMS (Twilio)
1. Sign up at https://twilio.com
2. Get Account SID, Auth Token, and Phone Number
3. Add to `.env.local`:
```
TWILIO_ACCOUNT_SID="your-sid"
TWILIO_AUTH_TOKEN="your-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

## Available Commands
```bash
npm run dev              # Start dev server
npm run build           # Build for production
npm run db:push         # Sync database schema
npm run db:seed         # Populate test data
npm run db:studio       # Prisma Studio
```

## Tech Stack
- Next.js 16, React 19, TypeScript
- PostgreSQL + Prisma ORM
- NextAuth.js, Tailwind CSS
- Resend (Email), Twilio (SMS)
- IP Tracking & Visitor Analytics
