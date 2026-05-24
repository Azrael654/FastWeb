import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await request.json();
  const cat = await prisma.category.update({ where: { id: params.id }, data: body });
  return new Response(JSON.stringify(cat), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    await prisma.category.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    if (e.code === 'P2003') {
      return new Response(JSON.stringify({ error: 'Kategori tidak dapat dihapus karena masih digunakan oleh produk.' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Gagal menghapus kategori' }), { status: 500 });
  }
};
