import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

  try {
    const body = await request.json();
    const cat = await prisma.blogCategory.update({
      where: { id },
      data: { name: body.name },
    });
    return new Response(JSON.stringify(cat), { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Kategori sudah ada' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

  try {
    await prisma.blogCategory.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
