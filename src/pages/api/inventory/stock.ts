import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const body = await request.json();
  const { materialId, type, quantity, note } = body;
  const result = await prisma.$transaction(async (tx) => {
    const material = await tx.rawMaterial.findUnique({ where: { id: materialId } });
    if (!material) throw new Error('Material not found');
    const prev = Number(material.stock);
    let newStock = prev;
    if (type === 'In') newStock = prev + Number(quantity);
    else if (type === 'Out') newStock = prev - Number(quantity);
    else newStock = Number(quantity);
    await tx.rawMaterial.update({ where: { id: materialId }, data: { stock: newStock } });
    const history = await tx.stockHistory.create({
      data: { materialId, type, quantity, previousStock: prev, currentStock: newStock, note },
    });
    return { material: { ...material, stock: newStock }, history };
  });
  return new Response(JSON.stringify(result), { status: 201 });
};
