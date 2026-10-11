import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
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
    const { email, role } = body;
    const workspaceId = user.workspaceId;

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role required' },
        { status: 400 }
      );
    }

    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.userInvitation.create({
      data: {
        email,
        role,
        token,
        expiresAt,
        workspaceId,
      },
    });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { settings: true },
    });

    const inviteUrl = `${process.env.NEXTAUTH_URL}/auth/accept-invite?token=${token}`;

    await sendEmail({
      to: email,
      subject: `You're invited to ${workspace?.settings?.companyName || workspace?.name}`,
      html: `
        <h2>You're invited!</h2>
        <p>You've been invited to join ${workspace?.settings?.companyName || workspace?.name} as a ${role}.</p>
        <p><a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
        <p>This link expires in 7 days.</p>
      `,
    });

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invitations = await prisma.userInvitation.findMany({
      where: {
        workspaceId: user.workspaceId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
