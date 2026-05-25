import type { APIRoute } from 'astro';
import prisma from '../../lib/prisma';
import { requireAdmin } from '../../lib/auth';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  // Optional date filters
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  let filterStart: Date | undefined;
  let filterEnd: Date | undefined;

  if (start) {
    filterStart = new Date(start + 'T00:00:00');
    filterEnd = end ? new Date(end + 'T23:59:59') : new Date();
  }

  const whereClause = filterStart
    ? { date: { gte: filterStart, ...(filterEnd ? { lte: filterEnd } : {}) } }
    : {};

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: { account: true },
    orderBy: { date: 'asc' },
  });

  const headers = ['Tanggal', 'Rekening', 'Tipe', 'Kategori', 'Deskripsi', 'Jumlah'];
  
  const csvRows = transactions.map(tx => {
    return [
      `"${new Date(tx.date).toLocaleDateString('id-ID')}"`,
      `"${tx.account.name}"`,
      `"${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}"`,
      `"${tx.category || '-'}"`,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${tx.amount.toString()}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...csvRows].join('\n');

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="laporan_keuangan_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
};
