import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await request.json();
  const cat = await prisma.category.update({ where: { id: params.id }, data: body });
  
  await logActivity(request, {
    userId: admin.id,
    userName: admin.name,
    action: 'UPDATE',
    module: 'categories',
    details: `Memperbarui kategori: ${cat.name}`,
  });

  return new Response(JSON.stringify(cat), { status: 200 });
};

export const DELETE: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    const cat = await prisma.category.findUnique({ where: { id: params.id } });
    await prisma.category.delete({ where: { id: params.id } });
    
    if (cat) {
      await logActivity(request, {
        userId: admin.id,
        userName: admin.name,
        action: 'DELETE',
        module: 'categories',
        details: `Menghapus kategori: ${cat.name}`,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e: any) {
    if (e.code === 'P2003') {
      return new Response(JSON.stringify({ error: 'Kategori tidak dapat dihapus karena masih digunakan oleh produk.' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Gagal menghapus kategori' }), { status: 500 });
  }
};
