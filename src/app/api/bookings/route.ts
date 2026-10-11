import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/google-calendar';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (session.user as any).workspaceId;
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: any = { workspaceId };
    if (startDate && endDate) {
      query.startTime = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const bookings = await prisma.booking.findMany({
      where: query,
      include: { contact: true, calendarEvent: true },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('List bookings error:', error);
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
    const userId = (session.user as any).id;
    const body = await req.json();
    const {
      title,
      description,
      startTime,
      endTime,
      guestEmail,
      guestName,
      guestPhone,
      location,
      conferenceUrl,
      contactId,
    } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: Math.round(
          (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000
        ),
        guestEmail,
        guestName,
        guestPhone,
        location,
        conferenceUrl,
        status: 'PENDING',
        workspaceId,
        userId,
        contactId: contactId || null,
      },
      include: { contact: true },
    });

    // Create calendar event
    const calResult = await createCalendarEvent(workspaceId, {
      title,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      guestEmail,
      location,
      conferenceUrl,
    });

    if (calResult.success && calResult.eventId) {
      await prisma.calendarEvent.create({
        data: {
          googleEventId: calResult.eventId,
          calendarId: guestEmail || 'primary',
          title,
          description,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          location,
          conferenceUrl,
          htmlLink: calResult.htmlLink,
          workspaceId,
          bookingId: booking.id,
        },
      });
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
