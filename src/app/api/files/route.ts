import { NextRequest, NextResponse } from 'next/server';
import { head } from '@vercel/blob';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
  }

  try {
    // For Vercel Blob private URLs, fetch with the token
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    const response = await fetch(url, {
      headers: blobToken ? {
        'Authorization': `Bearer ${blobToken}`,
      } : {},
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('File proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}
