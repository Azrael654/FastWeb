import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canPUT = await checkPermission(cookies, 'blog', 'update');
  if (!canPUT) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

  try {
    const body = await request.json();
    
    // id field cannot be updated directly
    const { id: _, ...updateData } = body;

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
    });
    
    await logActivity(request, {
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE',
      module: 'blog',
      details: `Memperbarui artikel blog: ${post.title}`,
    });

    return new Response(JSON.stringify(post), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canDELETE = await checkPermission(cookies, 'blog', 'delete');
  if (!canDELETE) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

  
  const { id } = params;
  if (!id) return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });

  try {
    const post = await prisma.blogPost.findUnique({ where: { id } });
    await prisma.blogPost.delete({ where: { id } });
    
    if (post) {
      await logActivity(request, {
        userId: admin.id,
        userName: admin.name,
        action: 'DELETE',
        module: 'blog',
        details: `Menghapus artikel blog: ${post.title}`,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
