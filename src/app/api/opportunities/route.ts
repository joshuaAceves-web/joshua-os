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
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };
    if (stage) where.stage = stage;
    if (status) where.status = status;

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: { contact: true },
      orderBy: [{ stage: 'asc' }, { createdAt: 'desc' }],
    });

    // Calculate pipeline value
    const pipelineValue = opportunities
      .filter((opp) => opp.status === 'OPEN')
      .reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0);

    return NextResponse.json({ opportunities, pipelineValue });
  } catch (error) {
    console.error('GET /api/opportunities error:', error);
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

    const opportunity = await prisma.opportunity.create({
      data: {
        ...body,
        workspaceId,
      },
      include: { contact: true },
    });

    await prisma.activity.create({
      data: {
        type: 'opportunity_created',
        description: `Created opportunity: ${opportunity.name}`,
        workspaceId,
        opportunityId: opportunity.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('POST /api/opportunities error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
