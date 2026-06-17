import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@nanostores/react';
import { cartItems, cartLoading, loadCart, updateQty, removeFromCart } from '../store/cart';

export default function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const items = useStore(cartItems);
  const loading = useStore(cartLoading);

  useEffect(() => {
    setMounted(true);
    loadCart();
  }, []);

  const cartTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = items.length;

  const drawerContent = (
    <div className="cart-drawer-portal">
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] transition-opacity" onClick={() => setIsOpen(false)}></div>
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            Keranjang ({cartCount})
          </h2>
          <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              </div>
              <div>
                <p className="text-gray-900 font-medium text-lg">Keranjang Kosong</p>
                <p className="text-gray-500 text-sm mt-1">Belum ada produk di keranjang Anda.</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="btn-primary mt-4">Mulai Belanja</button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-100 transition-colors group">
                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-blue-50 flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"/></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.dimension > 1 ? `Dimensi: ${item.dimension}` : ''}
                    </p>
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
                      <a href={item.designUrl} target="_blank" className="text-[10px] text-blue-600 font-medium hover:underline flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>
                        Desain Terlampir
                      </a>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 rounded-md px-2 py-1 mt-1 border border-amber-100">
                        📝 {item.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-blue-600 text-sm">Rp {item.price.toLocaleString('id')}</p>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-white rounded shadow-sm transition-all" disabled={item.qty <= 1}>-</button>
                      <span className="text-xs font-semibold w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-white rounded shadow-sm transition-all">+</button>
                    </div>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1 self-start">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
               <span className="text-gray-600 text-sm">Subtotal</span>
               <span className="font-bold text-gray-900 text-lg">Rp {cartTotal.toLocaleString('id')}</span>
             </div>
             <a href="/checkout" className="btn-primary w-full py-3.5 text-base shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30">
               Lanjut ke Checkout
             </a>
           </div>
         )}
       </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
        {cartCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white">
            {cartCount}
          </span>
        )}
      </button>
      {mounted && createPortal(drawerContent, document.body)}
    </>
  );
}
