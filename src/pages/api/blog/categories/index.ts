import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canPOST = await checkPermission(cookies, 'blog', 'create');
  if (!canPOST) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });


  try {
    const body = await request.json();
    const cat = await prisma.blogCategory.create({ data: { name: body.name } });
    return new Response(JSON.stringify(cat), { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Kategori sudah ada' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
