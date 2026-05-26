import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    const body = await request.json();
    const category = await prisma.materialCategory.update({
      where: { id: params.id },
      data: { name: body.name, description: body.description },
    });
    return new Response(JSON.stringify(category), { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Kategori sudah ada' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    await prisma.materialCategory.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
