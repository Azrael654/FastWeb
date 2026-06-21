import type { APIRoute } from 'astro';
import prisma from '../../lib/prisma';
import { requireAdmin } from '../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const startParam = url.searchParams.get('start');
  const endParam   = url.searchParams.get('end');
  const period     = url.searchParams.get('period') || 'all';

  const now = new Date();
  let filterStart: Date | undefined;
  let filterEnd: Date | undefined;

  if (startParam) {
    filterStart = new Date(startParam + 'T00:00:00');
    filterEnd   = endParam ? new Date(endParam + 'T23:59:59') : now;
  } else if (period === '7days') {
    filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '30days') {
    filterStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === 'this_year') {
    filterStart = new Date(now.getFullYear(), 0, 1);
  }

  const whereClause = filterStart
    ? { createdAt: { gte: filterStart, ...(filterEnd ? { lte: filterEnd } : {}) } }
    : {};

  const orders = await prisma.order.findMany({ 
    where: whereClause,
    orderBy: { createdAt: 'asc' }
  });

  // Build label for filename
  const rangeLabel = startParam
    ? `${startParam}_to_${endParam || 'today'}`
    : period;

  // Calculate Metrics
  let totalRevenue = 0;
  const volumeByDay: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};
  const statusDistribution: Record<string, number> = {
    pending: 0, processing: 0, done: 0, shipped: 0, delivered: 0, cancelled: 0
  };
  const productSales: Record<string, { name: string, qty: number, revenue: number }> = {};
  const customerStats: Record<string, { name: string, email: string, spent: number, orders: number }> = {};

  orders.forEach(order => {
    const dateStr = order.createdAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    
    statusDistribution[order.status] = (statusDistribution[order.status] || 0) + 1;
    volumeByDay[dateStr] = (volumeByDay[dateStr] || 0) + 1;

    if (order.status !== 'cancelled') {
      const orderTotal = Number(order.total);
      totalRevenue += orderTotal;
      revenueByDay[dateStr] = (revenueByDay[dateStr] || 0) + orderTotal;

      const email = order.customerEmail;
      if (!customerStats[email]) {
        customerStats[email] = { name: order.customerName, email, spent: 0, orders: 0 };
      }
      customerStats[email].spent += orderTotal;
      customerStats[email].orders += 1;

      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item: any) => {
        const id = item.id || item.name;
        if (!productSales[id]) {
          productSales[id] = { name: item.name, qty: 0, revenue: 0 };
        }
        productSales[id].qty += item.qty;
        productSales[id].revenue += (Number(item.price) * item.qty);
      });
    }
  });

  // Prepare CSV Output
  const lines: string[] = [];
  
  const reportPeriodLabel = startParam
    ? `${startParam} to ${endParam || 'today'}`
    : period === 'all' ? 'All Time' : period;

  lines.push('BUSINESS PERFORMANCE REPORT');
  lines.push(`Period: ${reportPeriodLabel}`);
  lines.push(`Generated: ${now.toLocaleString('id-ID')}`);
  lines.push(`Total Revenue: Rp ${totalRevenue.toLocaleString('id-ID')}`);
  lines.push(`Total Success Orders: ${orders.filter(o => o.status !== 'cancelled').length}`);
  lines.push('');

  // 1. Daily Metrics
  lines.push('DAILY METRICS');
  lines.push('Date,Order Volume,Revenue (Rp)');
  Object.keys(volumeByDay).forEach(date => {
    lines.push(`"${date}",${volumeByDay[date]},${revenueByDay[date] || 0}`);
  });
  lines.push('');

  // 2. Status Distribution
  lines.push('ORDER STATUS DISTRIBUTION');
  lines.push('Status,Count');
  Object.entries(statusDistribution).forEach(([status, count]) => {
    lines.push(`"${status}",${count}`);
  });
  lines.push('');

  // 3. Top Products
  lines.push('TOP PRODUCTS');
  lines.push('Product Name,Units Sold,Revenue (Rp)');
  const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 50);
  topProducts.forEach(p => {
    lines.push(`"${p.name.replace(/"/g, '""')}",${p.qty},${p.revenue}`);
  });
  lines.push('');

  // 4. Top Customers
  lines.push('TOP CUSTOMERS');
  lines.push('Customer Name,Email,Total Orders,Total Spent (Rp)');
  const topCustomers = Object.values(customerStats).sort((a, b) => b.spent - a.spent).slice(0, 50);
  topCustomers.forEach(c => {
    lines.push(`"${c.name.replace(/"/g, '""')}","${c.email}",${c.orders},${c.spent}`);
  });

  const csvContent = lines.join('\n');

  return new Response(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="business-performance-report-${rangeLabel}.csv"`
    }
  });
};
