import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const GET: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return new Response(JSON.stringify(order), { status: 200 });
};

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  const canUpdate = await checkPermission(cookies, 'orders', 'update');
  if (!canUpdate) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const body = await request.json();
  const existingOrder = await prisma.order.findUnique({ where: { id: params.id } });
  
  if (!existingOrder) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  // If status is moving forward from pending
  if (existingOrder.status === 'pending' && body.status && body.status !== 'pending' && body.status !== 'cancelled') {
    if (!body.paymentAccountId && !existingOrder.paymentAccountId) {
      return new Response(JSON.stringify({ error: 'Rekening penerima pembayaran harus dipilih untuk memproses pesanan ini.' }), { status: 400 });
    }

    const proofUrl = body.paymentProofUrl || existingOrder.paymentProofUrl;
    if (!proofUrl) {
      return new Response(JSON.stringify({ error: 'Bukti pembayaran harus diunggah sebelum mengubah status.' }), { status: 400 });
    }

    const accountId = body.paymentAccountId || existingOrder.paymentAccountId;

    const order = await prisma.order.update({ 
      where: { id: params.id }, 
      data: { 
        status: body.status,
        paymentAccountId: accountId,
        paymentProofUrl: proofUrl
      } 
    });

    // Create Finance Transaction
    await prisma.transaction.create({
      data: {
        type: 'income',
        accountId: accountId,
        amount: existingOrder.total,
        category: 'Penjualan', 
        description: `Pesanan #${existingOrder.id.slice(-8)} a.n. ${existingOrder.customerName}`,
        referenceId: existingOrder.id,
        imageUrl: proofUrl
      }
    });

    // Update account balance
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: existingOrder.total } }
    });

    await logActivity(request, {
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE',
      module: 'orders',
      details: `Memproses pesanan ${existingOrder.id.slice(-8)} (Status: ${body.status})`,
    });

    return new Response(JSON.stringify(order), { status: 200 });
  }

  // Normal update (e.g. uploading proof without changing status, or updating from processing -> shipped, or updating shipping fee)
  const updateData: any = { ...body };
  
  if (body.shippingFee !== undefined) {
    const fee = Number(body.shippingFee);
    updateData.shippingFee = fee;
    updateData.total = Number(existingOrder.subtotal) + fee - Number(existingOrder.discount);
  }

  const order = await prisma.order.update({ where: { id: params.id }, data: updateData });

  await logActivity(request, {
    userId: admin.id,
    userName: admin.name,
    action: 'UPDATE',
    module: 'orders',
    details: `Memperbarui pesanan ${existingOrder.id.slice(-8)}${body.status ? ` menjadi ${body.status}` : ''}`,
  });

  return new Response(JSON.stringify(order), { status: 200 });
};
