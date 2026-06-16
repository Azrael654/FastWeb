import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const GET: APIRoute = async () => {
  const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } });
  return new Response(JSON.stringify(categories), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  const canCreate = await checkPermission(cookies, 'products', 'create');
  if (!canCreate) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const body = await request.json();

  const cat = await prisma.category.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      image: body.image,
      showInHome: body.showInHome,
      showInFooter: body.showInFooter,
    }
  });

  await logActivity(request, {
    userId: admin.id,
    userName: admin.name,
    action: 'CREATE',
    module: 'categories',
    details: `Membuat kategori baru: ${cat.name}`,
  });

  return new Response(JSON.stringify(cat), { status: 201 });
};
