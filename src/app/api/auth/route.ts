import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password === process.env.APP_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('rezept-auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ error: 'Falsches Passwort' }, { status: 401 });
}
