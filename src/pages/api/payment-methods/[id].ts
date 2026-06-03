import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    const { id } = params;
    const body = await request.json();
    body.isActive = body.isActive === 'true' || body.isActive === true || body.isActive === 'on';
    
    const method = await prisma.paymentMethod.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        accountNumber: body.accountNumber,
        isActive: body.isActive,
        supportedShipping: body.supportedShipping || 'all',
      },
    });

    await logActivity(request, {
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE',
      module: 'config',
      details: `Memperbarui metode pembayaran: ${method.name}`,
    });

    return new Response(JSON.stringify(method), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    const { id } = params;
    const method = await prisma.paymentMethod.findUnique({ where: { id } });
    await prisma.paymentMethod.delete({ where: { id } });

    if (method) {
      await logActivity(request, {
        userId: admin.id,
        userName: admin.name,
        action: 'DELETE',
        module: 'config',
        details: `Menghapus metode pembayaran: ${method.name}`,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
