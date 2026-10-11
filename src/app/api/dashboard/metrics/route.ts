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

    const newLeads = await prisma.opportunity.count({
      where: { workspaceId, stage: 'NEW_LEAD' },
    });

    const activeLeads = await prisma.opportunity.count({
      where: { workspaceId, status: 'OPEN' },
    });

    const meetings = await prisma.opportunity.count({
      where: { workspaceId, stage: 'MEETING' },
    });

    const proposals = await prisma.opportunity.count({
      where: { workspaceId, stage: 'PROPOSAL' },
    });

    const wonClients = await prisma.opportunity.count({
      where: { workspaceId, status: 'WON' },
    });

    const activeProjects = await prisma.project.count({
      where: { workspaceId, status: { in: ['NOT_STARTED', 'IN_PROGRESS', 'WAITING', 'REVIEW'] } },
    });

    const now = new Date();
    const overdueTasks = await prisma.task.count({
      where: {
        workspaceId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
        dueDate: { lt: now },
      },
    });

    const pipelineOpportunities = await prisma.opportunity.findMany({
      where: { workspaceId, status: 'OPEN' },
      select: { estimatedValue: true },
    });

    const pipelineValue = pipelineOpportunities.reduce(
      (sum, opp) => sum + (opp.estimatedValue || 0),
      0
    );

    return NextResponse.json({
      newLeads,
      activeLeads,
      meetings,
      proposals,
      wonClients,
      activeProjects,
      overdueTasks,
      pipelineValue,
    });
  } catch (error) {
    console.error('GET /api/dashboard/metrics error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
