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
    const view = searchParams.get('view'); // today, upcoming, overdue, completed
    const workspaceId = (session.user as any).workspaceId;

    const where: any = { workspaceId };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (view === 'today') {
      where.dueDate = { gte: today, lt: tomorrow };
      where.status = { in: ['TODO', 'IN_PROGRESS'] };
    } else if (view === 'upcoming') {
      where.dueDate = { gte: tomorrow };
      where.status = { in: ['TODO', 'IN_PROGRESS'] };
    } else if (view === 'overdue') {
      where.dueDate = { lt: today };
      where.status = { in: ['TODO', 'IN_PROGRESS'] };
    } else if (view === 'completed') {
      where.status = 'DONE';
    }

    const tasks = await prisma.task.findMany({
      where,
      include: { project: true },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
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

    const task = await prisma.task.create({
      data: {
        ...body,
        workspaceId,
      },
      include: { project: true },
    });

    await prisma.activity.create({
      data: {
        type: 'task_created',
        description: `Created task: ${task.title}`,
        workspaceId,
        taskId: task.id,
        userId: session.user.id,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
