import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin, checkPermission } from '../../../lib/auth';
import { logActivity } from '../../../lib/logger';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canPUT = await checkPermission(cookies, 'marketing', 'update');
  if (!canPUT) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });


  try {
    const body = await request.json();
    const popup = await prisma.popup.update({
      where: { id: params.id },
      data: {
        ...(body.type !== undefined && {
          type: body.type,
        }),

        ...(body.title !== undefined && {
          title: body.title,
        }),

        ...(body.content !== undefined && {
          content:
            body.type === 'image_only'
              ? null
              : body.content,
        }),

        ...(body.imageUrl !== undefined && {
          imageUrl: body.imageUrl,
        }),

        ...(body.linkUrl !== undefined && {
          linkUrl: body.linkUrl,
        }),

        ...(body.linkText !== undefined && {
          linkText:
            body.type === 'image_only'
              ? null
              : body.linkText,
        }),

        ...(body.isActive !== undefined && {
          isActive: body.isActive,
        }),

        ...(body.displayMode !== undefined && {
          displayMode: body.displayMode,
        }),

        ...(body.delaySeconds !== undefined && {
          delaySeconds: Number(body.delaySeconds),
        }),
      },
    });

    await logActivity(request, {
      userId: admin.id,
      userName: admin.name,
      action: 'UPDATE',
      module: 'popups',
      details: `Memperbarui popup: ${popup.title}`,
    });

    return new Response(JSON.stringify(popup), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const canDELETE = await checkPermission(cookies, 'marketing', 'delete');
  if (!canDELETE) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });


  try {
    const popup = await prisma.popup.findUnique({ where: { id: params.id } });
    await prisma.popup.delete({ where: { id: params.id } });

    if (popup) {
      await logActivity(request, {
        userId: admin.id,
        userName: admin.name,
        action: 'DELETE',
        module: 'popups',
        details: `Menghapus popup: ${popup.title}`,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
};
