import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const { id } = params;
    const body = await request.json();
    if (!body.name?.trim()) {
      return new Response(JSON.stringify({ error: 'Nama tipe wajib diisi.' }), { status: 400 });
    }
    const type = await prisma.contactType.update({
      where: { id },
      data: {
        name: body.name.trim().toLowerCase(),
        color: body.color || 'badge-gray',
      },
    });
    return new Response(JSON.stringify(type), { status: 200 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Tipe dengan nama tersebut sudah ada.' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const { id } = params;
    await prisma.contactType.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
};
