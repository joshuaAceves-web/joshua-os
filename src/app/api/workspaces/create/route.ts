import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import * as bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceName, email, password } = body;

    if (!workspaceName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = workspaceName.toLowerCase().replace(/\s+/g, '-').substring(0, 50);

    // Create workspace with settings
    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName,
        slug: slug + '-' + Math.random().toString(36).substr(2, 5),
        settings: {
          create: {
            companyName: workspaceName,
          },
        },
      },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: email.split('@')[0],
        role: 'admin',
        workspaceId: workspace.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Workspace created successfully',
        workspace: { id: workspace.id, name: workspace.name, slug: workspace.slug },
        user: { id: user.id, email: user.email },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create workspace error:', error);

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return NextResponse.json(
        { error: `This ${field} already exists` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create workspace. Please try again.' },
      { status: 500 }
    );
  }
}
