import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { getSessionUser } from '../../../lib/auth';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const data = await request.json();
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: parseFloat(data.discountValue),
        minOrderValue: parseFloat(data.minOrderValue || '0'),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
        enabled: data.enabled !== undefined ? data.enabled : true,
      }
    });
    return new Response(JSON.stringify(coupon), { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Kode kupon sudah ada' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Gagal memperbarui kupon' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    await prisma.coupon.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Gagal menghapus kupon' }), { status: 500 });
  }
};
