import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/mongodb';
import { getSession } from '@/lib/auth';
import DocumentModel from '@/models/Document';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const tileCategory = formData.get('tileCategory') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!['VDI', 'Printer', 'Scanner'].includes(tileCategory)) {
      return NextResponse.json({ error: 'Invalid tile category' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    let extractedText = '';
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } catch {
      return NextResponse.json({ error: 'Could not extract text from PDF. Please try another file' }, { status: 422 });
    }

    // Save file to local filesystem
    const uploadDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    await connectDB();

    // Upsert: overwrite existing doc for this user/tile
    const doc = await DocumentModel.findOneAndUpdate(
      { userId: session.userId, tileCategory },
      {
        userId: session.userId,
        tileCategory,
        fileName: file.name,
        extractedText,
        fileUrl: `/uploads/${fileName}`,
        uploadedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, documentId: doc._id, fileName: file.name });
  } catch {
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
