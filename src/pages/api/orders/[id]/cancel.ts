import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { getSessionUser, checkPermission } from '../../../../lib/auth';

export const POST: APIRoute = async ({ params, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  try {
    const order = await prisma.order.findUnique({ where: { id: params.id } });
    
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    if (order.userId !== user.id && order.customerEmail !== user.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    if (order.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Order cannot be cancelled because it is not pending' }), { status: 400 });
    }

    const cancelledOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled' }
    });

    return new Response(JSON.stringify(cancelledOrder), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
