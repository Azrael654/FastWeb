import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../../lib/auth';

export const GET: APIRoute = async () => {
  const categories = await prisma.materialCategory.findMany({ orderBy: { name: 'asc' } });
  return new Response(JSON.stringify(categories), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canPOST = await checkPermission(cookies, 'products', 'create');
  if (!canPOST) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  
  const body = await request.json();
  if (body.id === "") delete body.id;

  try {
    const category = await prisma.materialCategory.create({ data: body });
    return new Response(JSON.stringify(category), { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Kategori sudah ada' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
