import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { listConversations, sendMessage } from '@/lib/messaging';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const conversations = await listConversations(workspaceId, status);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('List conversations error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const body = await req.json();
    const { phoneNumber, message, channel = 'sms', contactId } = body;

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sendMessage(
      workspaceId,
      contactId || null,
      phoneNumber,
      message,
      channel
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
