import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { getSessionUser, checkPermission } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

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

    await logActivity(request, {
      userId: user.id,
      userName: user.name,
      action: 'UPDATE',
      module: 'coupons',
      details: `Memperbarui kupon diskon: ${coupon.code}`,
    });

    return new Response(JSON.stringify(coupon), { status: 200 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Kode kupon sudah ada' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Gagal memperbarui kupon' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
    await prisma.coupon.delete({ where: { id: params.id } });

    if (coupon) {
      await logActivity(request, {
        userId: user.id,
        userName: user.name,
        action: 'DELETE',
        module: 'coupons',
        details: `Menghapus kupon diskon: ${coupon.code}`,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Gagal menghapus kupon' }), { status: 500 });
  }
};
