import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createEmailTemplate,
  listEmailTemplates,
} from '@/lib/email-templates';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    const templates = await listEmailTemplates(
      workspaceId,
      category || undefined
    );

    return NextResponse.json(templates);
  } catch (error) {
    console.error('List templates error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { name, slug, subject, html, plainText, description, category } = body;

    if (!name || !slug || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const template = await createEmailTemplate(workspaceId, {
      name,
      slug,
      subject,
      html,
      plainText,
      description,
      category,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error('Create template error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Template slug already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
