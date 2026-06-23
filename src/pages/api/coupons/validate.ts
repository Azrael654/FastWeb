import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { getSessionUser, checkPermission } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Harap masuk ke akun Anda' }), { status: 401 });
  }

  try {
    const { code, subtotal } = await request.json();
    if (!code) return new Response(JSON.stringify({ error: 'Kode kupon kosong' }), { status: 400 });

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!coupon || !coupon.enabled) {
      return new Response(JSON.stringify({ error: 'Kupon tidak valid atau tidak ditemukan' }), { status: 400 });
    }

    if (coupon.expiryDate && new Date() > new Date(coupon.expiryDate)) {
      return new Response(JSON.stringify({ error: 'Kupon sudah kadaluarsa' }), { status: 400 });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return new Response(JSON.stringify({ error: 'Batas pemakaian kupon sudah habis' }), { status: 400 });
    }

    // Evaluate applicableProducts
    let eligibleSubtotal = subtotal;
    const applicableProducts = Array.isArray(coupon.applicableProducts) ? coupon.applicableProducts : [];

    if (applicableProducts.length > 0) {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: user.id }
      });
      const eligibleItems = cartItems.filter(item => applicableProducts.includes(item.productId));

      if (eligibleItems.length === 0) {
        return new Response(JSON.stringify({ error: 'Kupon ini tidak berlaku untuk produk di keranjang Anda' }), { status: 400 });
      }

      eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
    }

    const minOrder = Number(coupon.minOrderValue);
    if (minOrder > 0 && eligibleSubtotal < minOrder) {
      const msg = applicableProducts.length > 0
        ? `Minimal transaksi produk promo Rp ${minOrder.toLocaleString('id')}`
        : `Minimal transaksi Rp ${minOrder.toLocaleString('id')} untuk menggunakan kupon ini`;
      return new Response(JSON.stringify({ error: msg }), { status: 400 });
    }

    const value = Number(coupon.discountValue);
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (eligibleSubtotal * value) / 100;
    } else {
      discountAmount = value;
    }

    if (discountAmount > eligibleSubtotal) {
      discountAmount = eligibleSubtotal;
    }

    return new Response(JSON.stringify({
      success: true,
      discount: discountAmount,
      code: coupon.code
    }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Terjadi kesalahan saat memvalidasi kupon' }), { status: 500 });
  }
};
