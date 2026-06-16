import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const types = await prisma.contactType.findMany({ orderBy: { name: 'asc' } });
  return new Response(JSON.stringify(types), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canPOST = await checkPermission(cookies, 'crm', 'create');
  if (!canPOST) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });


  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return new Response(JSON.stringify({ error: 'Nama tipe wajib diisi.' }), { status: 400 });
    }
    const type = await prisma.contactType.create({
      data: {
        name: body.name.trim().toLowerCase(),
        color: body.color || 'badge-gray',
      },
    });
    return new Response(JSON.stringify(type), { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Tipe dengan nama tersebut sudah ada.' }), { status: 409 });
    }
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
