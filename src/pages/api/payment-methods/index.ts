import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const GET: APIRoute = async () => {
  const methods = await prisma.paymentMethod.findMany({ orderBy: { name: 'asc' } });
  return new Response(JSON.stringify(methods), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  const body = await request.json();
  if (body.id === "") delete body.id;
  // Convert checkbox value to boolean
  body.isActive = body.isActive === 'true' || body.isActive === true || body.isActive === 'on';

  try {
    const method = await prisma.paymentMethod.create({ data: body });

    await logActivity(request, {
      userId: admin.id,
      userName: admin.name,
      action: 'CREATE',
      module: 'config',
      details: `Menambahkan metode pembayaran: ${method.name}`,
    });

    return new Response(JSON.stringify(method), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
