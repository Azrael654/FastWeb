import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Load /invoice-logo.svg into a base64 PNG via an off-screen canvas. */
export function loadInvoiceLogo(): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = '/invoice-logo.svg';
    } catch {
      resolve(null);
    }
  });
}

export async function loadStoreConfig(): Promise<any> {
  try {
    const res = await fetch('/api/config/store');
    if (res.ok) return await res.json();
  } catch { }
  return null;
}

export function generateInvoice(order: any, logoDataUrl?: string | null, storeConfig?: any) {
  const doc = new jsPDF();

  const formatPrice = (price: any) => Number(price).toLocaleString('id-ID');

  let statusText = 'INVOICE';
  if (order.status === 'delivered' || order.status === 'shipped' || order.status === 'processing' || order.status === 'done') {
    statusText = 'INVOICE - LUNAS';
  } else if (order.status === 'cancelled') {
    statusText = 'INVOICE - DIBATALKAN';
  } else {
    statusText = 'INVOICE - BELUM LUNAS';
  }

  // ── Header ────────────────────────────────────────────────────────────
  if (logoDataUrl) {
    // SVG viewBox is 1216×264 → aspect ≈ 4.6:1, so 60 × 13 mm fits nicely
    doc.addImage(logoDataUrl, 'PNG', 14, 11, 60, 14);
  } else {
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text(storeConfig?.storeName || 'FAST PRINT', 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(storeConfig?.tagline || 'Printing Solution', 14, 28);
  }

  let headerYOffset = logoDataUrl ? 30 : 34;

  if (storeConfig) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    if (storeConfig.address) {
      const splitAddress = doc.splitTextToSize(storeConfig.address, 90);
      doc.text(splitAddress, 14, headerYOffset);
      headerYOffset += splitAddress.length * 4;
    }
    const contacts = [];
    if (storeConfig.phone) contacts.push(`Telp: ${storeConfig.phone}`);
    if (storeConfig.whatsapp) contacts.push(`WA: ${storeConfig.whatsapp}`);
    if (storeConfig.email) contacts.push(`Email: ${storeConfig.email}`);
    if (contacts.length > 0) {
      doc.text(contacts.join(' | '), 14, headerYOffset);
      headerYOffset += 4;
    }
  }

  // Invoice title & status (right side)
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text(statusText, 140, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Order ID: #${order.id.slice(-8).toUpperCase()}`, 140, 28);
  doc.text(`Tanggal: ${new Date(order.createdAt).toLocaleDateString('id-ID')}`, 140, 34);

  let yPos = Math.max(headerYOffset + 2, 40);

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(14, yPos, 196, yPos);

  yPos += 10;

  // Customer info
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('Ditagihkan Kepada:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerName, 14, yPos + 6);
  doc.text(order.customerEmail, 14, yPos + 12);
  if (order.customerPhone) doc.text(order.customerPhone, 14, yPos + 18);

  let maxCustomerY = yPos + (order.customerPhone ? 18 : 12);

  // Shipping address
  if (order.shippingAddress) {
    const addr = order.shippingAddress;
    doc.setFont('helvetica', 'bold');
    doc.text('Dikirim Ke:', 100, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(addr.name || order.customerName, 100, yPos + 6);
    const splitAddress = doc.splitTextToSize(addr.address || '', 90);
    doc.text(splitAddress, 100, yPos + 12);
    const yOffset = yPos + 12 + splitAddress.length * 5;
    doc.text(`${addr.city || ''}, ${addr.province || ''} ${addr.postalCode || ''}`, 100, yOffset);
    if (addr.phone) doc.text(addr.phone, 100, yOffset + 5);
    maxCustomerY = Math.max(maxCustomerY, yOffset + (addr.phone ? 5 : 0));
  }

  const tableStartY = Math.max(maxCustomerY + 10, 90);

  // Items table
  const items = Array.isArray(order.items) ? order.items : [];
  const tableData = items.map((item: any) => {
    let desc = item.name;
    if (item.dimension) desc += ` (${item.dimension} ${item.pricingUnit || ''})`;
    if (item.options && Object.keys(item.options).length > 0) {
      const opts = Object.entries(item.options)
        .map(([k, v]: any) => `${k}: ${v.name}`)
        .join(', ');
      desc += `\n- ${opts}`;
    }
    return [
      desc,
      item.qty.toString(),
      `Rp ${formatPrice(item.price)}`,
      `Rp ${formatPrice(item.price * item.qty)}`,
    ];
  });

  autoTable(doc, {
    startY: tableStartY,
    head: [['Item / Deskripsi', 'Qty', 'Harga Satuan', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text('Subtotal:', 140, finalY);
  doc.text(`Rp ${formatPrice(order.subtotal)}`, 196, finalY, { align: 'right' });

  let currentY = finalY + 6;
  if (Number(order.discount) > 0) {
    doc.text(`Diskon ${order.couponCode ? `(${order.couponCode})` : ''}:`, 140, currentY);
    doc.setTextColor(220, 38, 38);
    doc.text(`-Rp ${formatPrice(order.discount)}`, 196, currentY, { align: 'right' });
    doc.setTextColor(40, 40, 40);
    currentY += 6;
  }

  if (Number(order.shippingFee) > 0) {
    doc.text(`Ongkir (${order.shippingMethod}):`, 140, currentY);
    doc.text(`Rp ${formatPrice(order.shippingFee)}`, 196, currentY, { align: 'right' });
    currentY += 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('Total Akhir:', 140, currentY + 2);
  doc.text(`Rp ${formatPrice(order.total)}`, 196, currentY + 2, { align: 'right' });

  // Payment method
  if (order.paymentMethod) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Metode Pembayaran: ${order.paymentMethod}`, 14, currentY + 2);

    if (order.paymentMethodDetails) {
      if (order.paymentMethodDetails.accountNumber) {
        doc.text(`No. Rekening: ${order.paymentMethodDetails.accountNumber}`, 14, currentY + 6);
        currentY += 4;
      }
      if (order.paymentMethodDetails.description) {
        doc.text(`Info: ${order.paymentMethodDetails.description}`, 14, currentY + 6);
        currentY += 4;
      }
    }
  }

  // Separator before terms
  const termsStartY = currentY + 16;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, termsStartY, 196, termsStartY);

  // Order Notes (if any)
  let notesEndY = termsStartY + 8;
  if (order.notes) {
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('Catatan Pesanan:', 14, notesEndY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const noteLines = doc.splitTextToSize(order.notes, 180);
    doc.text(noteLines, 14, notesEndY + 5);
    notesEndY += 5 + noteLines.length * 5 + 4;
  }

  // Terms & Conditions
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('Syarat & Ketentuan:', 14, notesEndY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const terms = [
    '1. Pembayaran harus dilakukan penuh sebelum pesanan diproses.',
    '2. Revisi desain hanya dapat dilakukan sebelum proses cetak dimulai.',
    '3. Barang yang sudah dikirim tidak dapat dikembalikan kecuali ada cacat produksi.',
    '4. Fast Print tidak bertanggung jawab atas keterlambatan pengiriman oleh jasa ekspedisi.',
  ];
  terms.forEach((term, i) => {
    doc.text(term, 14, notesEndY + 6 + i * 5);
  });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Terima kasih atas pesanan Anda!', 105, 286, { align: 'center' });

  doc.save(`Invoice_${order.id.slice(-8).toUpperCase()}.pdf`);
}
