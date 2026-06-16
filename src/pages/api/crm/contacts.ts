import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../lib/auth';

export const GET: APIRoute = async ({ url, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const contacts = await prisma.contact.findMany({ orderBy: { dateAdded: 'desc' } });
  return new Response(JSON.stringify(contacts), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canPOST = await checkPermission(cookies, 'crm', 'create');
  if (!canPOST) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  const body = await request.json();

  const contact = await prisma.contact.create({
    data: {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      company: body.company || null,
      type: body.type,
      notes: body.notes || null,
    }
  });
  return new Response(JSON.stringify(contact), { status: 201 });
};
