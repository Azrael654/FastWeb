import type { APIRoute } from 'astro';
import prisma from '../../lib/prisma';
import { requireAdmin } from '../../lib/auth';

/** Format number as Indonesian accounting style: 1.234.567 */
function fmt(n: number): string {
  return n.toLocaleString('id-ID');
}

/** Wrap a value in double-quotes and escape internal quotes */
function q(v: string | number): string {
  return `"${String(v).replace(/"/g, '""')}"`;
}

export const GET: APIRoute = async ({ cookies, url }) => {
  const admin = requireAdmin(cookies);
  if (!admin) return new Response('Unauthorized', { status: 401 });

  const start = url.searchParams.get('start');
  const end   = url.searchParams.get('end');

  let filterStart: Date | undefined;
  let filterEnd:   Date | undefined;

  if (start) {
    filterStart = new Date(start + 'T00:00:00');
    filterEnd   = end ? new Date(end + 'T23:59:59') : new Date();
  }

  const whereClause = filterStart
    ? { date: { gte: filterStart, ...(filterEnd ? { lte: filterEnd } : {}) } }
    : {};

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    include: { account: true },
    orderBy: { date: 'asc' },
  });

  // ── Build CSV ────────────────────────────────────────────────────────────
  const rows: string[] = [];
  const generatedAt = new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const periodLabel =
    filterStart && filterEnd
      ? `${filterStart.toLocaleDateString('id-ID')} s/d ${filterEnd.toLocaleDateString('id-ID')}`
      : 'Semua Periode';

  // ── Report header block ──────────────────────────────────────────────────
  rows.push(`"LAPORAN KEUANGAN",,,,,,,`);
  rows.push(`"Periode:","${periodLabel}",,,,,,`);
  rows.push(`"Digenerate:","${generatedAt}",,,,,,`);
  rows.push('');  // blank separator row

  // ── Column headers ───────────────────────────────────────────────────────
  rows.push([
    q('No.'),
    q('Tanggal'),
    q('Rekening'),
    q('Kategori'),
    q('Keterangan'),
    q('Debit (Rp)'),
    q('Kredit (Rp)'),
    q('Saldo (Rp)'),
  ].join(','));

  // ── Data rows with running balance ───────────────────────────────────────
  let runningBalance = 0;
  let totalDebit  = 0;
  let totalKredit = 0;

  transactions.forEach((tx, i) => {
    const amount = Number(tx.amount);
    const isIncome = tx.type === 'income';

    const debit  = isIncome ? amount : 0;
    const kredit = isIncome ? 0 : amount;
    runningBalance += isIncome ? amount : -amount;
    totalDebit  += debit;
    totalKredit += kredit;

    const dateStr = new Date(tx.date).toLocaleDateString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });

    rows.push([
      q(i + 1),
      q(dateStr),
      q(tx.account.name),
      q(tx.category || '-'),
      q((tx.description || '').replace(/"/g, '""')),
      q(debit  > 0 ? fmt(debit)  : '-'),
      q(kredit > 0 ? fmt(kredit) : '-'),
      q(fmt(runningBalance)),
    ].join(','));
  });

  // ── Summary footer ───────────────────────────────────────────────────────
  rows.push('');
  rows.push([
    q(''),
    q(''),
    q(''),
    q(''),
    q('TOTAL'),
    q(fmt(totalDebit)),
    q(fmt(totalKredit)),
    q(fmt(runningBalance)),
  ].join(','));

  rows.push([
    q(''),
    q(''),
    q(''),
    q(''),
    q('SELISIH BERSIH'),
    q(runningBalance >= 0 ? fmt(runningBalance) : '-'),
    q(runningBalance < 0  ? fmt(Math.abs(runningBalance)) : '-'),
    q(''),
  ].join(','));

  // ── BOM for proper Excel UTF-8 rendering ─────────────────────────────────
  const BOM = '\uFEFF';
  const csvContent = BOM + rows.join('\r\n');

  const filename = `laporan_keuangan_${new Date().toISOString().split('T')[0]}.csv`;

  return new Response(csvContent, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
};
