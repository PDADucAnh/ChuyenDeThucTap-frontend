'use client';

import { useEffect, useState, useMemo } from 'react'; // Thêm useMemo
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';

export default function CartPage() {
  // Bỏ getTotalPrice từ store, chỉ lấy items và các hàm action
  const { items, removeItem, updateQuantity } = useCartStore();
  
  const [isClient, setIsClient] = useState(false);
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => setIsClient(true), []);

  // --- SỬA LỖI: TÍNH TỔNG TIỀN TRỰC TIẾP TẠI ĐÂY ---
  // Mỗi khi "items" thay đổi (tăng giảm số lượng), biến này tự động tính lại ngay lập tức
  const totalPrice = useMemo(() => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [items]);

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  // Hàm cập nhật (UX ảo để người dùng yên tâm)
  const handleUpdateCart = () => {
    setIsUpdating(true);
    // Vì tính toán là realtime rồi, nút này chỉ mang ý nghĩa thông báo "Đã đồng bộ"
    setTimeout(() => {
        setIsUpdating(false); 
        setShowToast(true);   
        setTimeout(() => setShowToast(false), 3000);
    }, 500);
  };

  if (!isClient) return null;

  if (items.length === 0) {
    return (
        <div className="container mx-auto px-4 py-32 text-center animate-fadeIn">
            <h2 className="text-3xl font-light uppercase mb-6">Giỏ hàng</h2>
            <p className="text-gray-500 mb-8">Chưa có sản phẩm nào trong giỏ hàng.</p>
            <Link href="/products" className="inline-block bg-black text-white px-10 py-3 text-sm font-bold uppercase hover:bg-gray-800 transition">
                Quay lại cửa hàng
            </Link>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl relative">
      
      {/* Toast Notification */}
      <div className={`fixed bottom-5 right-5 z-50 transform transition-all duration-500 ${showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
          <div className="bg-black text-white px-6 py-4 rounded shadow-lg flex items-center gap-3">
              <CheckCircle className="text-green-400" size={24} />
              <div>
                  <h4 className="font-bold text-sm uppercase">Thành công</h4>
                  <p className="text-xs text-gray-300">Giỏ hàng đã được cập nhật.</p>
              </div>
          </div>
      </div>

      <h1 className="text-3xl font-bold uppercase mb-12">Giỏ hàng</h1>

      {/* HEADER */}
      <div className="hidden md:grid grid-cols-12 gap-8 border-b border-gray-200 pb-4 mb-6 text-sm text-gray-500">
        <div className="col-span-6 text-center">Sản phẩm</div>
        <div className="col-span-2 text-center">Giá</div>
        <div className="col-span-2 text-center">Số lượng</div>
        <div className="col-span-2 text-right">Tổng tiền</div>
      </div>

      {/* LIST ITEMS */}
      <div className="space-y-8 mb-12 border-b border-gray-200 pb-12">
        {items.map((item) => (
            <div key={`${item.id}-${item.size}-${item.color}`} className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8 items-center">
                
                {/* 1. Sản phẩm */}
                <div className="col-span-6 w-full flex gap-6">
                    <Link href={`/products/${item.slug}`} className="relative w-32 aspect-[3/4] flex-shrink-0 bg-gray-100">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </Link>
                    <div className="flex flex-col pt-2">
                        <Link href={`/products/${item.slug}`} className="text-base font-bold text-gray-900 hover:text-gray-600 uppercase mb-2">
                            {item.name}
                        </Link>
                        <div className="text-sm text-gray-500 space-y-1 mb-4">
                            <p>Phiên bản: {item.size} / {item.color}</p>
                            <p>Thương hiệu: NEM</p>
                        </div>
                        <button 
                            onClick={() => removeItem(item.id, item.size, item.color)}
                            className="text-sm text-gray-500 hover:text-black hover:underline w-fit text-left"
                        >
                            Xóa
                        </button>
                    </div>
                </div>

                {/* 2. Giá */}
                <div className="col-span-2 text-center">
                    <div className="flex flex-col items-center">
                        <span className="text-lg font-bold">{formatPrice(item.price)}</span>
                        <span className="text-sm text-gray-400 line-through decoration-1">{formatPrice(item.price)}</span>
                        <span className="bg-black text-white text-[10px] px-1 py-0.5 font-bold mt-1">-0%</span>
                    </div>
                </div>

                {/* 3. Số lượng (Khi bấm nút này, state items thay đổi -> totalPrice tự tính lại) */}
                <div className="col-span-2 flex justify-center">
                    <div className="flex items-center border border-gray-200 h-10 px-2">
                        <button 
                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                            className="p-2 text-gray-500 hover:text-black disabled:opacity-30"
                            disabled={item.quantity <= 1}
                        >
                            <ChevronLeft size={16}/>
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)}
                            className="p-2 text-gray-500 hover:text-black"
                        >
                            <ChevronRight size={16}/>
                        </button>
                    </div>
                </div>

                {/* 4. Thành tiền từng món */}
                <div className="col-span-2 text-right">
                    <span className="text-lg font-bold">{formatPrice(item.price * item.quantity)}</span>
                </div>

            </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                <label className="block text-sm text-gray-600 mb-2">Chú thích</label>
                <textarea 
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border border-gray-200 p-4 text-sm focus:outline-none focus:border-black resize-none"
                    placeholder="Ghi chú thêm cho đơn hàng..."
                ></textarea>
            </div>

            <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 mb-6 text-xl">
                    <span className="text-gray-600">Tổng tiền</span>
                    {/* Sử dụng biến totalPrice vừa tính ở trên */}
                    <span className="font-bold text-red-600">{formatPrice(totalPrice)}</span>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={handleUpdateCart}
                        disabled={isUpdating}
                        className="bg-black text-white w-32 py-3 text-sm font-bold uppercase hover:bg-gray-800 transition rounded-full flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isUpdating ? <Loader2 className="animate-spin" size={16}/> : 'Cập nhật'}
                    </button>
                    
                    <Link 
                        href="/checkout"
                        className="bg-black text-white px-8 py-3 text-sm font-bold uppercase hover:bg-gray-800 transition rounded-full flex items-center"
                    >
                        Thanh toán
                    </Link>
                </div>
            </div>
      </div>
    </div>
  );
}