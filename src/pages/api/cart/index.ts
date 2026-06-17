import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { getSessionUser } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return new Response(JSON.stringify([]), { status: 200 });

  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
  });

  // Normalize decimals to numbers
  const normalized = items.map(i => ({
    ...i,
    price: Number(i.price),
    dimension: Number(i.dimension),
  }));

  return new Response(JSON.stringify(normalized), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return new Response(JSON.stringify({ error: 'Login diperlukan untuk menambahkan ke keranjang.' }), { status: 401 });

  const body = await request.json();
  const { productId, name, slug, image, price, qty, dimension, options, designUrl, notes } = body;

  // Check if exact same product+options+dimension+price+designUrl+notes already in cart
  const existing = await prisma.cartItem.findFirst({
    where: {
      userId: user.id,
      productId,
      options: { equals: options ?? {} },
      dimension: dimension ?? 1,
      price,
      designUrl: designUrl ?? null,
      notes: notes ?? null,
    },
  });

  let item;
  if (existing) {
    item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { qty: existing.qty + (qty || 1) },
    });
  } else {
    item = await prisma.cartItem.create({
      data: {
        userId: user.id,
        productId,
        name,
        slug,
        image,
        price,
        qty: qty || 1,
        dimension: dimension || 1,
        options: options || {},
        designUrl,
        notes: notes || null,
      },
    });
  }

  return new Response(JSON.stringify({ ...item, price: Number(item.price), dimension: Number(item.dimension) }), { status: 201 });
};

export const DELETE: APIRoute = async ({ cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  await prisma.cartItem.deleteMany({ where: { userId: user.id } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
