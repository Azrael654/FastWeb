import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const data = await request.json();

    const existing = await prisma.role.findUnique({ where: { name: data.name } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'Role sudah ada' }), { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name: data.name.toLowerCase().trim(),
        description: data.description || null,
        isSystem: false,
        permissions: data.permissions || {},
      }
    });

    await logActivity(request, {
      userId: admin.id,
      userName: admin.name,
      action: 'CREATE',
      module: 'users',
      details: `Membuat role baru: ${role.name}`,
    });

    return new Response(JSON.stringify({ success: true, id: role.id }), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
