import type { APIRoute } from 'astro';
import prisma from '../../lib/prisma';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, company, message } = body;

    if (!firstName || !email || !message) {
      return new Response(JSON.stringify({ error: 'Nama, email, dan pesan wajib diisi.' }), { status: 400 });
    }

    const name = [firstName, lastName].filter(Boolean).join(' ');

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        type: 'message',
        notes: message,
      },
    });

    // Create Notification for Admin
    await prisma.notification.create({
      data: {
        title: 'Pesan Baru',
        message: `Pesan baru dari ${name}${company ? ` (${company})` : ''}: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`,
        type: 'info',
        link: '/admin/crm/messages',
      },
    });

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Terjadi kesalahan.' }), { status: 500 });
  }
};
