import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const { id } = params;
    const file = await (prisma as any).galleryFile.findUnique({ where: { id } });
    if (!file) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    const uploadDir = process.env.UPLOAD_DIR || './public/uploads';
    const filePath = path.join(uploadDir, file.filename);

    await (prisma as any).galleryFile.delete({ where: { id } });

    try {
      await fs.unlink(filePath);
    } catch (fsError) {
      console.log('Failed to delete physical file:', fsError);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
