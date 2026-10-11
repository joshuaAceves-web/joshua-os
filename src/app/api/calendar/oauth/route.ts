import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exchangeCodeForTokens, getAuthUrl } from '@/lib/google-calendar';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'authorize') {
      // Generate state token for CSRF protection
      const state = crypto.randomBytes(32).toString('hex');

      // Store state in session/cookie
      const response = NextResponse.redirect(getAuthUrl(state));
      response.cookies.set('google_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
      });

      return response;
    }

    if (action === 'callback') {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const workspaceId = (session.user as any).workspaceId;
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        return NextResponse.json(
          { error: 'Missing code or state' },
          { status: 400 }
        );
      }

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code);
      if (!tokens.access_token) {
        return NextResponse.json(
          { error: 'Failed to get access token' },
          { status: 400 }
        );
      }

      // Store integration
      const calendarId = tokens.id_token
        ? JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64').toString()).email
        : 'primary';

      await prisma.calendarIntegration.upsert({
        where: {
          workspaceId_calendarId: { workspaceId, calendarId },
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || undefined,
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
        },
        create: {
          workspaceId,
          calendarId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || '',
          expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
          primaryCalendar: true,
          userId: (session.user as any).id,
        },
      });

      // Redirect to bookings page
      return NextResponse.redirect('/bookings?connected=true');
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
