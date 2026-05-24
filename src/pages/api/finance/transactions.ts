import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

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
  const { accountId, type, amount, ...rest } = body;
  const tx = await prisma.$transaction(async (tx) => {
    const trx = await tx.transaction.create({ data: { accountId, type, amount, ...rest } });
    const delta = type === 'income' ? Number(amount) : -Number(amount);
    await tx.account.update({ where: { id: accountId }, data: { balance: { increment: delta } } });
    return trx;
  });
  return new Response(JSON.stringify(tx), { status: 201 });
};
