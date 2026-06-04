import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin, getSessionUser } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const GET: APIRoute = async ({ url, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { searchParams } = url;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status') || undefined;
  const search = searchParams.get('search') || '';
  const where: any = {};
  if (status) where.status = status;
  if (search) where.OR = [
    { customerName: { contains: search, mode: 'insensitive' } },
    { customerEmail: { contains: search, mode: 'insensitive' } },
    { id: { contains: search, mode: 'insensitive' } },
  ];
  const [orders, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.order.count({ where }),
  ]);
  return new Response(JSON.stringify({ orders, total, page, limit }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = getSessionUser(cookies);
    const body = await request.json();
    const { items, customerName, customerEmail, customerPhone, subtotal, total, discount, couponCode, shippingMethod, shippingFee, shippingAddress, paymentMethod } = body;
    const order = await prisma.order.create({
      data: {
        userId: user?.id || null,
        customerName, customerEmail, customerPhone,
        items, subtotal, total, discount, couponCode,
        shippingMethod, shippingFee, shippingAddress,
        paymentMethod, status: 'pending',
      },
    });
    if (couponCode) {
      await prisma.coupon.updateMany({ where: { code: couponCode }, data: { usageCount: { increment: 1 } } });
    }

    // Create Notification for Admin
    await prisma.notification.create({
      data: {
        title: 'Pesanan Baru',
        message: `Pesanan #${order.id.slice(-8).toUpperCase()} masuk dari ${customerName} sebesar Rp ${Number(total).toLocaleString('id-ID')}`,
        type: 'success',
        link: `/admin/orders/${order.id}`,
      },
    });

    await logActivity(request, {
      userId: user?.id,
      userName: user?.name || customerName,
      action: 'CREATE',
      module: 'orders',
      details: `Membuat pesanan baru: ${order.id.slice(-8)} a.n. ${customerName}`,
    });

    return new Response(JSON.stringify(order), { status: 201 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400 });
  }
};
