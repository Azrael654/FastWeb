import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies, url }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { searchParams } = url;
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { read: false },
      }),
    ]);

    return new Response(JSON.stringify({ notifications, unreadCount }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    
    if (body.all) {
      await prisma.notification.updateMany({
        where: { read: false },
        data: { read: true },
      });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    if (body.id) {
      const updated = await prisma.notification.update({
        where: { id: body.id },
        data: { read: true },
      });
      return new Response(JSON.stringify(updated), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Missing action' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ cookies, request }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const body = await request.json().catch(() => ({}));
    if (body.all) {
      await prisma.notification.deleteMany({});
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    if (body.id) {
      await prisma.notification.delete({ where: { id: body.id } });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: 'Missing parameter' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
