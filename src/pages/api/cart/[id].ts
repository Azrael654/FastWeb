import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { getSessionUser } from '../../../lib/auth';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { qty } = await request.json();
  if (!qty || qty < 1) return new Response(JSON.stringify({ error: 'Invalid qty' }), { status: 400 });

  const item = await prisma.cartItem.updateMany({
    where: { id: params.id, userId: user.id },
    data: { qty },
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  await prisma.cartItem.deleteMany({ where: { id: params.id, userId: user.id } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
