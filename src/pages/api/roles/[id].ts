import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

const SYSTEM_ROLES = ['admin', 'customer'];

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const body = await request.json();
    const role = await prisma.role.findUnique({ where: { id: params.id } });
    if (!role) return new Response(JSON.stringify({ error: 'Role tidak ditemukan' }), { status: 404 });

    // System roles (admin / customer) are read-only
    if (role.isSystem || SYSTEM_ROLES.includes(role.name)) {
      return new Response(JSON.stringify({ error: 'Role sistem tidak dapat diubah' }), { status: 400 });
    }

    if (body.name && body.name !== role.name) {
      const nameTaken = await prisma.role.findUnique({ where: { name: body.name.toLowerCase().trim() } });
      if (nameTaken) return new Response(JSON.stringify({ error: 'Nama role sudah digunakan' }), { status: 400 });
    }

    const updated = await prisma.role.update({
      where: { id: params.id },
      data: {
        name:        body.name        ? body.name.toLowerCase().trim() : undefined,
        description: body.description !== undefined ? body.description : undefined,
        permissions: body.permissions !== undefined ? body.permissions : undefined,
      }
    });

    return new Response(JSON.stringify({ success: true, id: updated.id }), { status: 200 });
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

    if (role.isSystem || SYSTEM_ROLES.includes(role.name)) {
      return new Response(JSON.stringify({ error: 'Role sistem tidak dapat dihapus' }), { status: 400 });
    }

    const usersWithRole = await prisma.appUser.count({ where: { role: role.name } });
    if (usersWithRole > 0) {
      return new Response(JSON.stringify({ error: `Tidak dapat menghapus — masih digunakan oleh ${usersWithRole} pengguna` }), { status: 400 });
    }

    await prisma.role.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
