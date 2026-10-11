import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all workspaces with stats
    const workspaces = await prisma.workspace.findMany({
      include: {
        users: true,
        contacts: true,
        opportunities: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const workspaceStats = workspaces.map((ws) => {
      const revenue = ws.opportunities
        .filter((opp: any) => opp.status === 'WON')
        .reduce((sum: number, opp: any) => sum + (opp.estimatedValue || 0), 0);

      return {
        id: ws.id,
        name: ws.name,
        users: ws.users.length,
        contacts: ws.contacts.length,
        opportunities: ws.opportunities.length,
        revenue: revenue,
        createdAt: ws.createdAt,
      };
    });

    const totals = {
      workspaces: workspaces.length,
      revenue: workspaceStats.reduce((sum, ws) => sum + ws.revenue, 0),
      contacts: workspaceStats.reduce((sum, ws) => sum + ws.contacts, 0),
    };

    return NextResponse.json({
      workspaces: workspaceStats,
      totals,
    });
  } catch (error) {
    console.error('Admin workspaces error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
