import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { getSessionUser, checkPermission } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const GET: APIRoute = async ({ cookies }) => {
  const user = getSessionUser(cookies);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return new Response(JSON.stringify(coupons), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const data = await request.json();
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        discountType: data.discountType, // 'percentage' | 'fixed'
        discountValue: parseFloat(data.discountValue),
        minOrderValue: parseFloat(data.minOrderValue || '0'),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
        enabled: data.enabled !== undefined ? data.enabled : true,
        applicableProducts: data.applicableProducts || [],
      }
    });

    await logActivity(request, {
      userId: user.id,
      userName: user.name,
      action: 'CREATE',
      module: 'coupons',
      details: `Membuat kupon diskon: ${coupon.code}`,
    });

    return new Response(JSON.stringify(coupon), { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Kode kupon sudah ada' }), { status: 400 });
    }
    return new Response(JSON.stringify({ error: 'Gagal membuat kupon' }), { status: 500 });
  }
};
