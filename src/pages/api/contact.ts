import type { APIRoute } from 'astro';
import prisma from '../../lib/prisma';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, message } = body;

    if (!firstName || !email || !message) {
      return new Response(JSON.stringify({ error: 'Nama, email, dan pesan wajib diisi.' }), { status: 400 });
    }

    const name = [firstName, lastName].filter(Boolean).join(' ');

    await prisma.contact.create({
      data: {
        name,
        email,
        phone: phone || null,
        type: 'lead',
        notes: message,
      },
    });

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Terjadi kesalahan.' }), { status: 500 });
  }
};
