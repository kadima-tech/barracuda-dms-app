import { NextRequest, NextResponse } from 'next/server';

// Configure the route to be dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// This file is kept for compatibility, but the actual proxying is handled by Next.js rewrites
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API routes are handled by Next.js rewrites',
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'API routes are handled by Next.js rewrites',
  });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({
    message: 'API routes are handled by Next.js rewrites',
  });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    message: 'API routes are handled by Next.js rewrites',
  });
}
