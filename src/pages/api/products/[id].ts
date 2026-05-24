import type { APIRoute } from 'astro';
import prisma from "../../../lib/prisma";
import { requireAdmin } from '../../../lib/auth';

export const GET: APIRoute = async ({ params }) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true, productOptions: true },
    });
    if (!product) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(JSON.stringify(product), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  try {
    const body = await request.json();
    const { id, options, ...dataToUpdate } = body; // remove id and options from update data

    const product = await prisma.$transaction(async (tx) => {
      // If options array is provided, replace all existing options
      if (Array.isArray(options)) {
        await tx.productOption.deleteMany({ where: { productId: params.id } });
        if (options.length > 0) {
          await tx.productOption.createMany({
            data: options.map((opt: any) => ({
              productId: params.id!,
              type: opt.type,
              name: opt.name,
              value: opt.value || opt.name,
              priceAdj: parseFloat(opt.priceAdj) || 0,
              isDefault: opt.isDefault === true || opt.isDefault === 'true',
            }))
          });
        }
      }
      return tx.product.update({ where: { id: params.id }, data: dataToUpdate });
    });

    return new Response(JSON.stringify(product), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  try {
    await prisma.product.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
