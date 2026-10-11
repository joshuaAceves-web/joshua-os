import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await req.json();
    const { slug } = params;

    // Find form by slug
    const form = await prisma.form.findUnique({
      where: { slug },
    });

    if (!form || !form.isActive) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Save submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        workspaceId: form.workspaceId,
        data: JSON.stringify(body),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || undefined,
      },
    });

    // Create/update contact from form data
    let contact = await prisma.contact.findFirst({
      where: {
        email: body.email,
        workspaceId: form.workspaceId,
      },
    });

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          firstName: body.firstName,
          email: body.email,
          phone: body.phone,
          businessName: body.businessName,
          notes: body.message,
          workspaceId: form.workspaceId,
          source: 'Form',
        },
      });

      // Create opportunity
      await prisma.opportunity.create({
        data: {
          name: `${body.firstName} - ${body.businessName || 'Lead'}`,
          stage: 'NEW_LEAD',
          status: 'OPEN',
          contactId: contact.id,
          workspaceId: form.workspaceId,
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          type: 'form_submitted',
          description: `New lead from form: ${body.firstName}`,
          workspaceId: form.workspaceId,
          contactId: contact.id,
        },
      });
    }

    return NextResponse.json(
      { success: true, submissionId: submission.id, contactId: contact.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
