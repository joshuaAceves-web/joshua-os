import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getJobsStatus } from '@/lib/queue';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const status = await getJobsStatus(workspaceId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('Get jobs status error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
