import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import path from 'path';
import prisma from '../../lib/prisma';
import { requireAdmin } from '../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const admin = requireAdmin(cookies);
    if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
    }

    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${filename}`;

    // Save to Gallery
    const galleryFile = await (prisma as any).galleryFile.create({
      data: {
        filename,
        originalName: file.name,
        url,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      }
    });

    return new Response(JSON.stringify({ url, galleryFile }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload file' }), { status: 500 });
  }
};
