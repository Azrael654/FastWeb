import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartItems, clearCart } from '../store/cart';

export default function CheckoutForm({ user }: { user?: { name: string; email: string; phone?: string; id: string } | null }) {
  const items = useStore(cartItems);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [shippingMethod, setShippingMethod] = useState<'dikirim' | 'ambil'>('dikirim');
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  
  const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.qty, 0);
  const shippingFee = shippingMethod === 'dikirim' ? 15000 : 0; // Flat rate 15k for courier, 0 for pickup
  const total = subtotal + shippingFee - discount;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (items.length === 0) return alert('Keranjang kosong!');
    
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);
    
    const shippingAddress = shippingMethod === 'dikirim' ? {
      name: data.customerName,
      phone: data.customerPhone,
      address: data.address,
      city: data.city,
      province: data.province,
      postalCode: data.postalCode,
    } : null;

    const payload = {
      items,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      subtotal,
      shippingFee,
      discount,
      couponCode: couponCode || undefined,
      total,
      shippingMethod: shippingMethod === 'dikirim' ? 'Dikirim Kurir' : 'Ambil di Toko',
      paymentMethod: data.paymentMethod,
      shippingAddress,
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        clearCart();
        setSuccess(true);
      } else {
        const err = await res.json();
        alert('Gagal membuat pesanan: ' + (err.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Error: ' + e);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-20 card max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Pesanan Berhasil!</h2>
        <p className="text-gray-600 mb-8">Terima kasih telah berbelanja di Fast Print. Kami akan segera memproses pesanan Anda.</p>
        <a href="/shop" className="btn-primary">Lanjut Belanja</a>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 card max-w-2xl mx-auto">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        <p className="text-gray-500 font-medium mb-6">Keranjang Anda masih kosong</p>
        <a href="/shop" className="btn-primary">Mulai Belanja</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-7 space-y-8">
        {/* Contact Info */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Informasi Kontak</h2>
          <div className="space-y-4">
            <div><label className="label">Nama Lengkap *</label><input name="customerName" required defaultValue={user?.name || ''} className="input-field" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Email *</label><input name="customerEmail" type="email" required defaultValue={user?.email || ''} className="input-field" /></div>
              <div><label className="label">No. Telepon / WhatsApp *</label><input name="customerPhone" required defaultValue={user?.phone || ''} className="input-field" /></div>
            </div>
          </div>
        </div>

        {/* Shipping Method */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Metode Pengiriman</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${shippingMethod === 'dikirim' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300'}`}>
              <input type="radio" name="shippingMethodRadio" value="dikirim" checked={shippingMethod === 'dikirim'} onChange={(e) => setShippingMethod(e.target.value as any)} className="mt-1 w-4 h-4 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Dikirim Kurir</p>
                <p className="text-xs text-gray-500 mt-1">Pesanan akan dikirim ke alamat Anda (Flat Rp 15.000)</p>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-colors ${shippingMethod === 'ambil' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-blue-300'}`}>
              <input type="radio" name="shippingMethodRadio" value="ambil" checked={shippingMethod === 'ambil'} onChange={(e) => setShippingMethod(e.target.value as any)} className="mt-1 w-4 h-4 text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900 text-sm">Ambil di Toko</p>
                <p className="text-xs text-gray-500 mt-1">Ambil sendiri pesanan Anda di lokasi toko kami (Gratis)</p>
              </div>
            </label>
          </div>
        </div>

        {/* Shipping Info */}
        {shippingMethod === 'dikirim' && (
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Alamat Pengiriman</h2>
            <div className="space-y-4">
              <div><label className="label">Alamat Lengkap *</label><textarea name="address" required className="input-field" rows={3}></textarea></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Kota/Kabupaten *</label><input name="city" required className="input-field" /></div>
                <div><label className="label">Provinsi *</label><input name="province" required className="input-field" /></div>
              </div>
              <div><label className="label">Kode Pos *</label><input name="postalCode" required className="input-field w-1/2" /></div>
            </div>
          </div>
        )}

        {/* Payment Info */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Metode Pembayaran</h2>
          <div className="space-y-3">
            {[
              { id: 'bca', name: 'Transfer BCA (Dicek Manual)', desc: 'No. Rekening akan diinformasikan setelah checkout.' },
              { id: 'mandiri', name: 'Transfer Mandiri (Dicek Manual)', desc: 'No. Rekening akan diinformasikan setelah checkout.' },
            ].map(m => (
              <label key={m.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 transition-colors">
                <input type="radio" name="paymentMethod" value={m.id} defaultChecked={m.id === 'bca'} className="mt-1 w-4 h-4 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-5">
        <div className="card p-6 sticky top-24">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Ringkasan Pesanan</h2>
          
          <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Qty: {item.qty} {item.dimension ? `(Uk: ${item.dimension})` : ''}</p>
                  {item.options && Object.keys(item.options).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(item.options).map(([type, opt]: any) => (
                        <span key={type} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                          <span className="capitalize font-medium">{type}</span>: {opt.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {item.designUrl && (
                    <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                      Desain Terlampir
                    </p>
                  )}
                  <p className="font-bold text-gray-900 mt-1">Rp {(item.price * item.qty).toLocaleString('id')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>Rp {subtotal.toLocaleString('id')}</span></div>
            <div className="flex justify-between text-gray-600">
              <span>Pengiriman ({shippingMethod === 'dikirim' ? 'Kurir' : 'Ambil di Toko'})</span>
              <span>{shippingFee > 0 ? `Rp ${shippingFee.toLocaleString('id')}` : 'Gratis'}</span>
            </div>
            {discount > 0 && <div className="flex justify-between text-green-600"><span>Diskon ({couponCode})</span><span>-Rp {discount.toLocaleString('id')}</span></div>}
            <div className="flex justify-between font-bold text-xl text-gray-900 pt-3 border-t border-gray-100">
              <span>Total Tagihan</span>
              <span className="text-blue-600">Rp {total.toLocaleString('id')}</span>
            </div>
          </div>

          <button type="submit" disabled={loading} className={`btn-primary w-full py-4 text-base mt-8 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? 'Memproses...' : 'Buat Pesanan Sekarang'}
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Dengan membuat pesanan, Anda menyetujui Syarat & Ketentuan kami.
          </p>
        </div>
      </div>
    </form>
  );
}
