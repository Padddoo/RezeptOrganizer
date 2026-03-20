import { NextRequest, NextResponse } from 'next/server';
import { extractRecipeFromImage, extractRecipeFromText } from '@/lib/extract-recipe';
import pdf from 'pdf-parse';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileType } = await request.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'Keine Datei angegeben' }, { status: 400 });
    }

    // Fetch file from Vercel Blob (private, needs auth token)
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    const response = await fetch(fileUrl, {
      headers: blobToken ? { 'Authorization': `Bearer ${blobToken}` } : {},
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Datei konnte nicht geladen werden' }, { status: 400 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (fileType === 'pdf') {
      // Extract text from PDF, then use Claude to parse
      const data = await pdf(buffer);
      const result = await extractRecipeFromText(data.text);
      return NextResponse.json(result);
    } else {
      // Send image directly to Claude Vision
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const result = await extractRecipeFromImage(buffer, contentType);
      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'Texterkennung fehlgeschlagen' }, { status: 500 });
  }
}
