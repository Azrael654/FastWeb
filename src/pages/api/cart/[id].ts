import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { getSessionUser } from '../../../lib/auth';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { qty } = await request.json();
  if (!qty || qty < 1) return new Response(JSON.stringify({ error: 'Invalid qty' }), { status: 400 });

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!cartItem) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

  const product = await prisma.product.findUnique({
    where: { id: cartItem.productId }
  });

  let updatedPrice = Number(cartItem.price);

  if (product) {
    if (qty < product.minOrderQty) {
      return new Response(JSON.stringify({ error: `Minimal pesanan adalah ${product.minOrderQty}` }), { status: 400 });
    }

    let startingPrice = product.pricingType === 'fixed' ? Number(product.price) : Number(product.unitPrice || product.price);
    const wholesalePrices = Array.isArray(product.wholesalePrices) 
      ? (product.wholesalePrices as any[]).sort((a,b) => b.minQty - a.minQty) 
      : [];
    
    const totalUnits = product.pricingType === 'fixed' ? qty : Number(cartItem.dimension) * qty;
    let basePrice = startingPrice;
    
    const applicableWs = wholesalePrices.find(ws => totalUnits >= ws.minQty);
    if (applicableWs) basePrice = Number(applicableWs.price);

    let adj = Object.values(cartItem.options as any).reduce((sum: number, opt: any) => sum + (Number(opt.priceAdj) || 0), 0);
    let unit = basePrice + adj;
    updatedPrice = product.pricingType === 'fixed' ? unit : unit * Number(cartItem.dimension);
  }

  await prisma.cartItem.update({
    where: { id: cartItem.id },
    data: { qty, price: updatedPrice },
  });

  return new Response(JSON.stringify({ success: true, price: updatedPrice }), { status: 200 });
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const user = getSessionUser(cookies);
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  await prisma.cartItem.deleteMany({ where: { id: params.id, userId: user.id } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
