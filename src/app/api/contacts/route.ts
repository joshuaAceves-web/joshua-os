import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        opportunities: { include: { opportunity: true } },
        projects: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('GET /api/contacts error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const workspaceId = (session.user as any).workspaceId;

    // Check for duplicate email
    if (body.email) {
      const existing = await prisma.contact.findFirst({
        where: { email: body.email, workspaceId },
      });
      if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
    }

    const contact = await prisma.contact.create({
      data: {
        ...body,
        workspaceId,
      },
      include: {
        opportunities: true,
        projects: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'contact_created',
        description: `Created contact: ${contact.firstName} ${contact.lastName}`,
        workspaceId,
        contactId: contact.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('POST /api/contacts error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
