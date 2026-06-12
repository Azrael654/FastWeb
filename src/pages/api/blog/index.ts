import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const GET: APIRoute = async ({ url, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ orderBy: { date: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.blogPost.count(),
  ]);
  return new Response(JSON.stringify({ posts, total }), { status: 200 });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await request.json();

  const { id, ...data } = body;

  const post = await prisma.blogPost.create({
    data,
  });

  await logActivity(request, {
    userId: admin.id,
    userName: admin.name,
    action: 'CREATE',
    module: 'blog',
    details: `Membuat artikel blog: ${post.title}`,
  });

  return new Response(JSON.stringify(post), { status: 201 });
};
