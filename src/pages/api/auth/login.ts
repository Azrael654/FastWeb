import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { hashPassword, verifyPassword, signToken, setSessionCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const body = await request.json();
    const { email, password, name, action } = body;

    if (action === 'register') {
      const existing = await prisma.appUser.findUnique({ where: { email } });
      if (existing) {
        return new Response(JSON.stringify({ error: 'Email sudah terdaftar' }), { status: 400 });
      }
      const hashed = await hashPassword(password);
      const user = await prisma.appUser.create({
        data: { name, email, password: hashed, role: 'customer' },
      });
      const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
      setSessionCookie(cookies, token);
      return new Response(JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } }), { status: 201 });
    }

    // Login
    const user = await prisma.appUser.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ error: 'Email atau password salah' }), { status: 401 });
    }
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Email atau password salah' }), { status: 401 });
    }
    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    setSessionCookie(cookies, token);
    return new Response(JSON.stringify({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
