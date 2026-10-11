import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { listInboxItems, getInboxStats, searchInbox } from '@/lib/inbox';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const query = searchParams.get('q');
    const unread = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (action === 'stats') {
      const stats = await getInboxStats(workspaceId);
      return NextResponse.json(stats);
    }

    if (action === 'search' && query) {
      const results = await searchInbox(workspaceId, query);
      return NextResponse.json(results);
    }

    const items = await listInboxItems(workspaceId, {
      unreadOnly: unread,
      type: type || undefined,
      limit,
      offset,
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Inbox error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
