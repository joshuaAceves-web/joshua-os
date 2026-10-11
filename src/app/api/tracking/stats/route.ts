import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;

    // Total visitors
    const totalVisitors = await prisma.visitor.count({
      where: { workspaceId },
    });

    // Unique emails
    const uniqueEmails = await prisma.visitor.findMany({
      where: { workspaceId, email: { not: null } },
      distinct: ['email'],
      select: { email: true },
    });

    // Unique IPs
    const uniqueIPs = await prisma.visitor.findMany({
      where: { workspaceId },
      distinct: ['ipAddress'],
      select: { ipAddress: true },
    });

    // Today's visitors
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayVisitors = await prisma.visitor.count({
      where: {
        workspaceId,
        createdAt: { gte: today },
      },
    });

    // Recent visitors
    const recentVisitors = await prisma.visitor.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      totalVisitors,
      uniqueEmails: uniqueEmails.length,
      uniqueIPs: uniqueIPs.length,
      todayVisitors,
      recentVisitors,
    });
  } catch (error) {
    console.error('Tracking stats error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
