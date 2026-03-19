import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage, extractTextFromPdf } from '@/lib/ocr';
import { extractRecipeWithAI } from '@/lib/extract-recipe';

export async function POST(request: NextRequest) {
  try {
    const { fileUrl, fileType } = await request.json();

    if (!fileUrl) {
      return NextResponse.json({ error: 'Keine Datei angegeben' }, { status: 400 });
    }

    let rawText: string;

    // Fetch file from URL (Vercel Blob or local)
    const response = await fetch(fileUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    if (fileType === 'pdf') {
      rawText = await extractTextFromPdf(buffer);
    } else {
      rawText = await extractTextFromImage(fileUrl);
    }

    const result = await extractRecipeWithAI(rawText);

    return NextResponse.json(result);
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'Texterkennung fehlgeschlagen' }, { status: 500 });
  }
}
