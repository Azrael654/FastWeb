import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { checkPermission, hashPassword, requireAdmin } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const POST: APIRoute = async ({ request, cookies }) => {
  const canAdd = await checkPermission(cookies, 'users', 'add');
  if (!canAdd) return new Response(JSON.stringify({ error: 'Unauthorized: Missing add permission for users' }), { status: 403 });

  try {
    const data = await request.json();
    
    // Check if email already exists
    const existing = await prisma.appUser.findUnique({ where: { email: data.email } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'Email sudah digunakan' }), { status: 400 });
    }

    const hashedPassword = await hashPassword(data.password);
    
    const user = await prisma.appUser.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone || null,
        role: data.role || 'customer'
      }
    });
    
    const admin = requireAdmin(cookies);
    if (admin) {
      await logActivity(request, {
        userId: admin.id,
        userName: admin.name,
        action: 'CREATE',
        module: 'users',
        details: `Mendaftarkan pengguna baru: ${user.name} (${user.role})`,
      });
    }

    return new Response(JSON.stringify({ success: true, id: user.id }), { status: 201 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
