import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const body = await request.json();
    const popup = await prisma.popup.update({
      where: { id: params.id },
      data: {
        title: body.title,
        content: body.content !== undefined ? body.content : undefined,
        imageUrl: body.imageUrl !== undefined ? body.imageUrl : undefined,
        linkUrl: body.linkUrl !== undefined ? body.linkUrl : undefined,
        linkText: body.linkText !== undefined ? body.linkText : undefined,
        isActive: body.isActive !== undefined ? body.isActive === true : undefined,
        displayMode: body.displayMode,
        delaySeconds: body.delaySeconds !== undefined ? Number(body.delaySeconds) : undefined,
      }
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
    await prisma.popup.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
