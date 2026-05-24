import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { requireAdmin } from '../../../lib/auth';

export const GET: APIRoute = async ({ cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [totalOrders, pendingOrders, monthOrders, lastMonthOrders, recentOrders, topProducts, accounts] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'pending' } }),
    prisma.order.aggregate({ where: { date: { gte: startOfMonth }, status: { not: 'cancelled' } }, _sum: { total: true }, _count: true }),
    prisma.order.aggregate({ where: { date: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { not: 'cancelled' } }, _sum: { total: true } }),
    prisma.order.findMany({ orderBy: { date: 'desc' }, take: 5 }),
    prisma.order.findMany({ where: { status: { not: 'cancelled' } }, select: { items: true } }),
    prisma.account.findMany(),
  ]);

  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);
  const monthRevenue = Number(monthOrders._sum.total || 0);
  const lastMonthRevenue = Number(lastMonthOrders._sum.total || 0);
  const revenueGrowth = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

  return new Response(JSON.stringify({
    totalOrders, pendingOrders, monthRevenue, revenueGrowth,
    monthOrderCount: monthOrders._count, totalBalance, recentOrders,
  }), { status: 200 });
};
