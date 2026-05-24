import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    const body = await request.json();
    
    // Prevent changing the name of core roles 'admin' or 'customer'
    const role = await prisma.role.findUnique({ where: { id: params.id } });
    if (!role) return new Response(JSON.stringify({ error: 'Role tidak ditemukan' }), { status: 404 });
    
    if ((role.name === 'admin' || role.name === 'customer') && body.name && body.name !== role.name) {
      return new Response(JSON.stringify({ error: 'Tidak dapat mengubah nama role sistem inti' }), { status: 400 });
    }

    const updatedRole = await prisma.role.update({
      where: { id: params.id },
      data: {
        name: body.name ? body.name.toLowerCase().trim() : undefined,
        description: body.description
      }
    });
    
    return new Response(JSON.stringify({ success: true, id: updatedRole.id }), { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2002') return new Response(JSON.stringify({ error: 'Nama role sudah digunakan' }), { status: 400 });
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    const role = await prisma.role.findUnique({ where: { id: params.id } });
    if (!role) return new Response(JSON.stringify({ error: 'Role tidak ditemukan' }), { status: 404 });
    
    if (role.name === 'admin' || role.name === 'customer') {
      return new Response(JSON.stringify({ error: 'Tidak dapat menghapus role sistem inti' }), { status: 400 });
    }

    // Check if any users have this role
    const usersWithRole = await prisma.appUser.count({ where: { role: role.name } });
    if (usersWithRole > 0) {
      return new Response(JSON.stringify({ error: `Tidak dapat menghapus role karena masih digunakan oleh ${usersWithRole} pengguna` }), { status: 400 });
    }

    await prisma.role.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
