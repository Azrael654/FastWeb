import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../../lib/auth';
import { logActivity } from '../../../../lib/logger';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canPUT = await checkPermission(cookies, 'finance', 'update');
  if (!canPUT) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  
  try {
    const { id } = params;
    const body = await request.json();
    const account = await prisma.account.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
      },
    });

    await logActivity(request, {
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE',
      module: 'finance',
      details: `Memperbarui rekening/akun keuangan: ${account.name}`,
    });

    return new Response(JSON.stringify(account), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canDELETE = await checkPermission(cookies, 'finance', 'delete');
  if (!canDELETE) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  
  try {
    const { id } = params;
    const account = await prisma.account.findUnique({ where: { id } });
    await prisma.account.delete({ where: { id } });

    if (account) {
      await logActivity(request, {
        userId: admin.id,
        userName: admin.name,
        action: 'DELETE',
        module: 'finance',
        details: `Menghapus rekening/akun keuangan: ${account.name}`,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
