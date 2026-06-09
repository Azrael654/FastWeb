import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';

export const GET: APIRoute = async () => {
  const config = await prisma.storeConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  });
  return new Response(JSON.stringify(config), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { storeName, tagline, address, phone, email, whatsapp } = body;

  const config = await prisma.storeConfig.upsert({
    where: { id: 'singleton' },
    update: { storeName, tagline, address, phone, email, whatsapp },
    create: { id: 'singleton', storeName, tagline, address, phone, email, whatsapp },
  });

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
