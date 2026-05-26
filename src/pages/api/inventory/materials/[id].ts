import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';

export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    const data = await request.json();
    const material = await prisma.rawMaterial.update({
      where: { id: params.id },
      data: {
        name: data.name,
        unit: data.unit,
        category: data.category || null,
        minStock: data.minStock ? parseFloat(data.minStock) : 0,
      }
    });
    return new Response(JSON.stringify(material), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Failed to update material: ' + error.message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  
  try {
    await prisma.rawMaterial.delete({
      where: { id: params.id }
    });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Failed to delete material: ' + error.message }), { status: 500 });
  }
};
