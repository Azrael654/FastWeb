import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify({ error: 'No IDs provided' }), { status: 400 });
    }

    const files = await (prisma as any).galleryFile.findMany({ where: { id: { in: ids } } });

    await (prisma as any).galleryFile.deleteMany({ where: { id: { in: ids } } });

    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    for (const file of files) {
      try {
        await fs.unlink(path.join(uploadDir, file.filename));
      } catch (fsError) {
        console.log('Failed to delete physical file:', file.filename, fsError);
      }
    }

    return new Response(JSON.stringify({ success: true, deleted: files.length }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
