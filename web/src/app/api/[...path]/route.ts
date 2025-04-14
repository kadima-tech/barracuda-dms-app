import { NextRequest, NextResponse } from 'next/server';

// Configure the route to be dynamic
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// This file is kept for compatibility, but the actual proxying is handled by Next.js rewrites
export async function GET(request: Request) {
  // Use the request parameter
  const url = new URL(request.url);
  return Response.json({ message: `GET request to ${url.pathname}` });
}

export async function POST(request: Request) {
  // Use the request parameter
  const body = await request.json();
  return Response.json({ message: 'POST request received', data: body });
}

export async function PUT(request: Request) {
  // Use the request parameter
  const body = await request.json();
  return Response.json({ message: 'PUT request received', data: body });
}

export async function DELETE(request: Request) {
  // Use the request parameter
  const url = new URL(request.url);
  return Response.json({ message: `DELETE request to ${url.pathname}` });
}
