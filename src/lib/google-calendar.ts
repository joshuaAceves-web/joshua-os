import { google } from 'googleapis';
import { prisma } from './prisma';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export function getAuthUrl(state: string) {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent',
  });
}

export async function exchangeCodeForTokens(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error exchanging code:', error);
    throw error;
  }
}

export async function createCalendarEvent(
  workspaceId: string,
  booking: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    guestEmail?: string;
    location?: string;
    conferenceUrl?: string;
  }
) {
  try {
    // Get integration
    const integration = await prisma.calendarIntegration.findFirst({
      where: { workspaceId, isActive: true, primaryCalendar: true },
    });

    if (!integration) {
      return { success: false, error: 'No calendar integration found' };
    }

    // Set auth
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event: any = {
      summary: booking.title,
      description: booking.description,
      start: { dateTime: booking.startTime.toISOString() },
      end: { dateTime: booking.endTime.toISOString() },
      location: booking.location,
    };

    if (booking.guestEmail) {
      event.attendees = [{ email: booking.guestEmail }];
    }

    if (booking.conferenceUrl) {
      event.conferenceData = {
        entryPoints: [
          {
            entryPointType: 'video',
            uri: booking.conferenceUrl,
          },
        ],
      };
    }

    const response = await calendar.events.insert({
      calendarId: integration.calendarId,
      requestBody: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateCalendarEvent(
  workspaceId: string,
  eventId: string,
  updates: {
    title?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
  }
) {
  try {
    const integration = await prisma.calendarIntegration.findFirst({
      where: { workspaceId, isActive: true },
    });

    if (!integration) {
      return { success: false, error: 'No calendar integration found' };
    }

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event: any = {};
    if (updates.title) event.summary = updates.title;
    if (updates.description) event.description = updates.description;
    if (updates.startTime) event.start = { dateTime: updates.startTime.toISOString() };
    if (updates.endTime) event.end = { dateTime: updates.endTime.toISOString() };

    await calendar.events.update({
      calendarId: integration.calendarId,
      eventId,
      requestBody: event,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteCalendarEvent(
  workspaceId: string,
  eventId: string
) {
  try {
    const integration = await prisma.calendarIntegration.findFirst({
      where: { workspaceId, isActive: true },
    });

    if (!integration) {
      return { success: false, error: 'No calendar integration found' };
    }

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: integration.calendarId,
      eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return { success: false, error: String(error) };
  }
}

export async function syncCalendarEvents(workspaceId: string) {
  try {
    const integration = await prisma.calendarIntegration.findFirst({
      where: { workspaceId, isActive: true, primaryCalendar: true },
    });

    if (!integration) {
      return { success: false, error: 'No calendar integration found' };
    }

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events from last 30 days
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);

    const response = await calendar.events.list({
      calendarId: integration.calendarId,
      timeMin: timeMin.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    let synced = 0;

    for (const event of events) {
      if (!event.id || !event.start) continue;

      // Check if already exists
      const existing = await prisma.calendarEvent.findUnique({
        where: { workspaceId_googleEventId: { workspaceId, googleEventId: event.id } },
      });

      if (!existing && event.start.dateTime) {
        await prisma.calendarEvent.create({
          data: {
            googleEventId: event.id,
            calendarId: integration.calendarId,
            title: event.summary || 'Untitled',
            description: event.description,
            startTime: new Date(event.start.dateTime),
            endTime: event.end?.dateTime ? new Date(event.end.dateTime) : new Date(event.start.dateTime),
            location: event.location,
            conferenceUrl: event.conferenceData?.entryPoints?.[0]?.uri,
            htmlLink: event.htmlLink || undefined,
            workspaceId,
          },
        });
        synced++;
      }
    }

    // Update last sync time
    await prisma.calendarIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return { success: true, synced };
  } catch (error) {
    console.error('Error syncing calendar:', error);
    return { success: false, error: String(error) };
  }
}
