import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const { searchParams } = url;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('category') || undefined;
    const featured = searchParams.get('featured');

    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;
    if (featured === 'true') where.isFeatured = true;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, productOptions: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return new Response(JSON.stringify({ products, total, page, limit }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  try {
    const body = await request.json();
    const { options, ...productData } = body;

    const product = await prisma.product.create({
      data: {
        ...productData,
        ...(Array.isArray(options) && options.length > 0 ? {
          productOptions: {
            create: options.map((opt: any) => ({
              type: opt.type,
              name: opt.name,
              value: opt.value || opt.name,
              priceAdj: parseFloat(opt.priceAdj) || 0,
              isDefault: opt.isDefault === true || opt.isDefault === 'true',
            }))
          }
        } : {})
      }
    });
    return new Response(JSON.stringify(product), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};
