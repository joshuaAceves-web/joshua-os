import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendSMS } from '@/lib/sms';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { to, message } = body;

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    const result = await sendSMS({ to, message });

    if (result.success) {
      return NextResponse.json(
        { success: true, messageId: result.messageId },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send SMS error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
