import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const GET: APIRoute = async ({ url, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const accounts = await prisma.account.findMany({ orderBy: { name: 'asc' } });
  return new Response(JSON.stringify(accounts), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await request.json();
  const account = await prisma.account.create({ data: body });
  
  await logActivity(request, {
    userId: admin.id,
    userName: admin.name,
    action: 'CREATE',
    module: 'finance',
    details: `Membuat rekening/akun keuangan: ${account.name}`,
  });

  return new Response(JSON.stringify(account), { status: 201 });
};
