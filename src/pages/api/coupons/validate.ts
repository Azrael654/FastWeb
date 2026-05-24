import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { code, orderTotal } = await request.json();
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.enabled) return new Response(JSON.stringify({ error: 'Kupon tidak valid' }), { status: 400 });
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) return new Response(JSON.stringify({ error: 'Kupon sudah kadaluarsa' }), { status: 400 });
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return new Response(JSON.stringify({ error: 'Kupon sudah mencapai batas penggunaan' }), { status: 400 });
    if (Number(coupon.minOrderValue) > 0 && orderTotal < Number(coupon.minOrderValue)) return new Response(JSON.stringify({ error: `Minimal order Rp ${Number(coupon.minOrderValue).toLocaleString('id')}` }), { status: 400 });
    let discount = 0;
    if (coupon.discountType === 'percentage') discount = (orderTotal * Number(coupon.discountValue)) / 100;
    else discount = Number(coupon.discountValue);
    return new Response(JSON.stringify({ valid: true, discount, coupon }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
