import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../../lib/auth';

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canDELETE = await checkPermission(cookies, 'crm', 'delete');
  if (!canDELETE) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });


  try {
    const { id } = params;
    await prisma.contact.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canPUT = await checkPermission(cookies, 'crm', 'update');
  if (!canPUT) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });


  try {
    const { id } = params;
    const body = await request.json();
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        company: body.company || null,
        type: body.type,
        notes: body.notes || null,
      },
    });
    return new Response(JSON.stringify(contact), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
};
