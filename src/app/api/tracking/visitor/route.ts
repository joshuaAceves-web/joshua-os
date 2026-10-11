import { prisma } from '@/lib/prisma';
import { captureVisitor } from '@/lib/tracking';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, workspaceId, page } = body;

    const visitor = captureVisitor(email, page);

    await prisma.visitor.create({
      data: {
        email: visitor.email,
        ipAddress: visitor.ip,
        userAgent: visitor.userAgent,
        country: visitor.country,
        page: visitor.page,
        workspaceId: workspaceId || null,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Visitor tracked' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const visits = await prisma.visitor.findMany({
      where: { email },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(visits);
  } catch (error) {
    console.error('Visitor lookup error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
