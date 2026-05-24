import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    const body = await request.json();
    const updateData: any = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role
    };

    // Only update password if provided
    if (body.password && body.password.trim() !== '') {
      const { hashPassword } = await import('../../../lib/auth');
      updateData.password = await hashPassword(body.password);
    }

    const user = await prisma.appUser.update({ where: { id: params.id }, data: updateData });
    return new Response(JSON.stringify({ success: true, id: user.id }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  // Prevent admin from deleting themselves
  if (admin.id === params.id) {
    return new Response(JSON.stringify({ error: 'Anda tidak dapat menghapus akun Anda sendiri' }), { status: 400 });
  }
  
  try {
    await prisma.appUser.delete({ where: { id: params.id } });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
