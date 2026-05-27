import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoice(order: any) {
  const doc = new jsPDF();
  
  // Format currency
  const formatPrice = (price: any) => Number(price).toLocaleString("id-ID");

  // Determine invoice status text
  let statusText = 'INVOICE';
  if (order.status === 'delivered' || order.status === 'shipped' || order.status === 'processing') {
    statusText = 'INVOICE - LUNAS';
  } else if (order.status === 'cancelled') {
    statusText = 'INVOICE - DIBATALKAN';
  } else {
    statusText = 'INVOICE - BELUM LUNAS';
  }

  // Header
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text('FAST PRINT', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Printing Solution', 14, 28);
  
  // Invoice Title & Status
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(statusText, 140, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Order ID: #${order.id.slice(-8).toUpperCase()}`, 140, 28);
  doc.text(`Tanggal: ${new Date(order.createdAt).toLocaleDateString('id-ID')}`, 140, 34);

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 40, 196, 40);

  // Customer Info
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('Ditagihkan Kepada:', 14, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.text(order.customerName, 14, 56);
  doc.text(order.customerEmail, 14, 62);
  if (order.customerPhone) doc.text(order.customerPhone, 14, 68);
  
  // Shipping Address
  if (order.shippingAddress) {
    const addr = order.shippingAddress;
    doc.setFont('helvetica', 'bold');
    doc.text('Dikirim Ke:', 100, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(addr.name || order.customerName, 100, 56);
    
    // Handle multiline address
    const splitAddress = doc.splitTextToSize(addr.address || '', 90);
    doc.text(splitAddress, 100, 62);
    
    const yOffset = 62 + (splitAddress.length * 5);
    doc.text(`${addr.city || ''}, ${addr.province || ''} ${addr.postalCode || ''}`, 100, yOffset);
    if (addr.phone) doc.text(addr.phone, 100, yOffset + 5);
  }

  // Items Table
  const items = Array.isArray(order.items) ? order.items : [];
  const tableData = items.map((item: any) => {
    let desc = item.name;
    if (item.dimension) desc += ` (${item.dimension} ${item.pricingUnit || ''})`;
    if (item.options && Object.keys(item.options).length > 0) {
      const opts = Object.entries(item.options).map(([k, v]: any) => `${k}: ${v.name}`).join(', ');
      desc += `\n- ${opts}`;
    }
    return [
      desc,
      item.qty.toString(),
      `Rp ${formatPrice(item.price)}`,
      `Rp ${formatPrice(item.price * item.qty)}`
    ];
  });

  autoTable(doc, {
    startY: 90,
    head: [['Item / Deskripsi', 'Qty', 'Harga Satuan', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Summary
  doc.setFontSize(10);
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

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Terima kasih atas pesanan Anda!', 105, 280, { align: 'center' });

  // Save the PDF
  doc.save(`Invoice_${order.id.slice(-8).toUpperCase()}.pdf`);
}
