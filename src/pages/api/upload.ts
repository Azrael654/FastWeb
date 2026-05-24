import type { APIRoute } from 'astro';
import { promises as fs } from 'fs';
import path from 'path';

export const POST: APIRoute = async ({ request }) => {
  try {
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

    // URL to access the uploaded file
    const url = `/uploads/${filename}`;

    return new Response(JSON.stringify({ url }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to upload file' }), { status: 500 });
  }
};
