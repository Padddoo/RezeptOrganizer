import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fileName = `${uuidv4()}.${ext}`;
    const isPdf = file.type === 'application/pdf' || ext === 'pdf';

    const blob = await put(`uploads/${fileName}`, file, {
      access: 'private',
    });

    return NextResponse.json({
      fileUrl: blob.url,
      fileType: isPdf ? 'pdf' : 'image',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 });
  }
}
