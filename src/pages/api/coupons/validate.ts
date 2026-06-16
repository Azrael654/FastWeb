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

    const minOrder = Number(coupon.minOrderValue);
    if (minOrder > 0 && subtotal < minOrder) {
      return new Response(JSON.stringify({ error: `Minimal transaksi Rp ${minOrder.toLocaleString('id')} untuk menggunakan kupon ini` }), { status: 400 });
    }

    const value = Number(coupon.discountValue);
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * value) / 100;
      // Optional: cap maximum discount if needed, but not specified in schema
    } else {
      discountAmount = value;
    }

    // Don't discount more than subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
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
