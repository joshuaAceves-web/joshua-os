import { headers } from 'next/headers';

export function getClientIP(): string {
  try {
    const headersList = headers();

    // Try different headers where IP might be stored
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIP = headersList.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    return '0.0.0.0';
  } catch (error) {
    console.error('Error getting IP:', error);
    return '0.0.0.0';
  }
}

export function getUserAgent(): string {
  try {
    const headersList = headers();
    return headersList.get('user-agent') || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

export function getCountryFromIP(ip: string): string {
  // Placeholder - en producción integraría con un servicio como MaxMind
  return 'Unknown';
}

export interface VisitorData {
  email?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  country?: string;
  page?: string;
}

export function captureVisitor(email?: string, page?: string): VisitorData {
  return {
    email,
    ip: getClientIP(),
    userAgent: getUserAgent(),
    timestamp: new Date(),
    country: getCountryFromIP(getClientIP()),
    page,
  };
}
