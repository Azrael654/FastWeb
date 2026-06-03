import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const { id } = params;
    await prisma.contact.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
};
