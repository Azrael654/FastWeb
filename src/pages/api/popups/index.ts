import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const popups = await prisma.popup.findMany({ orderBy: { createdAt: 'desc' } });
  return new Response(JSON.stringify(popups), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const body = await request.json();
    const popup = await prisma.popup.create({
      data: {
        type: body.type || 'full',
        title: body.title,
        content: body.type === 'image_only' ? null : (body.content || null),
        imageUrl: body.imageUrl || null,
        linkUrl: body.linkUrl || null,
        linkText: body.type === 'image_only' ? null : (body.linkText || null),
        isActive: body.isActive === true,
        displayMode: body.displayMode || 'once',
        delaySeconds: Number(body.delaySeconds) || 0,
      }
    });
    return new Response(JSON.stringify(popup), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
