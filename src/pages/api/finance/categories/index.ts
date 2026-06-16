import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const categories = await prisma.transactionCategory.findMany({ orderBy: { name: 'asc' } });
  return new Response(JSON.stringify(categories), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canPOST = await checkPermission(cookies, 'finance', 'create');
  if (!canPOST) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  
  const body = await request.json();
  // Remove empty id so Prisma can generate a new cuid()
  if (body.id === "") {
    delete body.id;
  }
  
  try {
    const cat = await prisma.transactionCategory.create({ data: body });
    return new Response(JSON.stringify(cat), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
