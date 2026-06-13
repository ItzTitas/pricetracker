import { NextResponse } from 'next/server';

export async function GET() {
  const isConfigured = !!(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_ID !== 'mock-google-client-id'
  );
  return NextResponse.json({ configured: isConfigured });
}
