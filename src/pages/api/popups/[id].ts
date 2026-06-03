import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const body = await request.json();
    const popup = await prisma.popup.update({
      where: { id: params.id },
      data: {
        type: body.type !== undefined ? body.type : undefined,
        title: body.title,
        content: body.content !== undefined ? (body.type === 'image_only' ? null : body.content) : undefined,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
        linkUrl: body.linkUrl !== undefined ? body.linkUrl : undefined,
        linkText: body.linkText !== undefined ? (body.type === 'image_only' ? null : body.linkText) : undefined,
        isActive: body.isActive !== undefined ? body.isActive === true : undefined,
        displayMode: body.displayMode,
        delaySeconds: body.delaySeconds !== undefined ? Number(body.delaySeconds) : undefined,
      }
    });

    await logActivity(request, {
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE',
      module: 'popups',
      details: `Memperbarui popup: ${popup.title}`,
    });

    return new Response(JSON.stringify(popup), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const popup = await prisma.popup.findUnique({ where: { id: params.id } });
    await prisma.popup.delete({ where: { id: params.id } });

    if (popup) {
      await logActivity(request, {
        userId: admin.id,
        userName: admin.name,
        action: 'DELETE',
        module: 'popups',
        details: `Menghapus popup: ${popup.title}`,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
