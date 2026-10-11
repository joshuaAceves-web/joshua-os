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

    const workspaceId = (session.user as any).workspaceId;
    let settings = await prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await prisma.workspaceSettings.create({
        data: {
          workspaceId,
          companyName: 'My Company',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const workspaceId = user.workspaceId;

    const updated = await prisma.workspaceSettings.update({
      where: { workspaceId },
      data: {
        companyName: body.companyName,
        logoUrl: body.logoUrl,
        faviconUrl: body.faviconUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        accentColor: body.accentColor,
        companyWebsite: body.companyWebsite,
        supportEmail: body.supportEmail,
        supportPhone: body.supportPhone,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
