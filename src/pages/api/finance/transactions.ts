import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const GET: APIRoute = async ({ url, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { searchParams } = url;
  const accountId = searchParams.get('accountId') || undefined;
  const type = searchParams.get('type') || undefined;
  const where: any = {};
  if (accountId) where.accountId = accountId;
  if (type) where.type = type;
  const transactions = await prisma.transaction.findMany({
    where, include: { account: true }, orderBy: { date: 'desc' }, take: 100,
  });
  return new Response(JSON.stringify(transactions), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await request.json();
  const { accountId, targetAccountId, type, amount, ...rest } = body;
  
  const tx = await prisma.$transaction(async (tx) => {
    if (type === 'transfer') {
      // 1. Create expense on source account
      const sourceTx = await tx.transaction.create({ 
        data: { 
          accountId, 
          type: 'expense', 
          amount, 
          category: rest.category || 'Transfer Out',
          description: rest.description ? `${rest.description} (Ke Rekening Tujuan)` : 'Transfer Keluar'
        } 
      });
      await tx.account.update({ where: { id: accountId }, data: { balance: { decrement: Number(amount) } } });
      
      // 2. Create income on target account
      await tx.transaction.create({ 
        data: { 
          accountId: targetAccountId, 
          type: 'income', 
          amount, 
          category: rest.category || 'Transfer In',
          description: rest.description ? `${rest.description} (Dari Rekening Sumber)` : 'Transfer Masuk'
        } 
      });
      await tx.account.update({ where: { id: targetAccountId }, data: { balance: { increment: Number(amount) } } });
      
      return sourceTx;
    } else {
      // Regular income/expense
      const trx = await tx.transaction.create({ data: { accountId, type, amount, ...rest } });
      const delta = type === 'income' ? Number(amount) : -Number(amount);
      await tx.account.update({ where: { id: accountId }, data: { balance: { increment: delta } } });
      return trx;
    }
  });
  
  await logActivity(request, {
    userId: admin.id,
    userName: admin.name,
    action: 'CREATE',
    module: 'finance',
    details: `Mencatat transaksi keuangan baru: ${type.toUpperCase()} sebesar ${amount}`,
  });

  return new Response(JSON.stringify(tx), { status: 201 });
};
