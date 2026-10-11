import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { markAsRead, toggleFlag, addLabel } from '@/lib/inbox';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.inboxItem.findUnique({
      where: { id: params.id },
      include: {
        contact: true,
        message: true,
        submission: true,
        replies: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Get inbox item error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, label } = body;

    let result;

    if (action === 'read') {
      result = await markAsRead(params.id);
    } else if (action === 'flag') {
      result = await toggleFlag(params.id);
    } else if (action === 'label' && label) {
      result = await addLabel(params.id, label);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Update inbox item error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
