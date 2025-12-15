'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import Link from 'next/link';
// SỬA LỖI 1: Bỏ 'User as UserIcon' vì không sử dụng
import { MessageCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // SỬA LỖI 2: Dùng setTimeout để tránh lỗi 'setState synchronously' của Linter
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Logic Redirect
  useEffect(() => {
    if (mounted && !user) {
        router.push('/login');
    }
  }, [mounted, user, router]);

  if (!mounted) return null;

  if (!user) return <div className="p-20 text-center">Đang chuyển hướng...</div>;

  return (
    <div className="bg-white min-h-[600px]">
        {/* Breadcrumb */}
        <div className="border-b border-gray-100">
            <div className="container mx-auto px-4 py-4 text-xs md:text-sm text-gray-500">
                <Link href="/">TRANG CHỦ</Link> / <span className="text-black font-medium">TÀI KHOẢN</span>
            </div>
        </div>

        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-light text-gray-800 mb-2">Xin chào,</h1>
            <h2 className="text-4xl font-bold text-black mb-12 uppercase">{user.name}</h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* SIDEBAR MENU */}
                <div className="lg:col-span-1 border-r border-gray-100 pr-4">
                    <ul className="space-y-4 text-sm text-gray-600">
                        <li>
                            <Link href="/profile" className="text-black font-bold block border-l-2 border-black pl-3">Thông tin tài khoản</Link>
                        </li>
                        <li>
                            <Link href="/orders" className="hover:text-black block pl-3 border-l-2 border-transparent hover:border-gray-300 transition">Quản lý đơn hàng</Link>
                        </li>
                        <li>
                            <Link href="/address" className="hover:text-black block pl-3 border-l-2 border-transparent hover:border-gray-300 transition">Sổ địa chỉ</Link>
                        </li>
                        <li>
                            <Link href="/wishlist" className="hover:text-black block pl-3 border-l-2 border-transparent hover:border-gray-300 transition">Sản phẩm yêu thích</Link>
                        </li>
                    </ul>
                </div>

                {/* MAIN CONTENT (THÔNG TIN) */}
                <div className="lg:col-span-3">
                    <div className="max-w-2xl space-y-6">
                        
                        {/* Họ tên */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Họ tên</label>
                            <div className="bg-gray-100 px-4 py-3 rounded-sm text-gray-800 font-medium">
                                {user.name}
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Email</label>
                            <div className="bg-gray-100 px-4 py-3 rounded-sm text-gray-800">
                                {user.email}
                            </div>
                        </div>

                        {/* Quốc gia */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Quốc gia:</label>
                            <div className="bg-gray-100 px-4 py-3 rounded-sm text-gray-800">
                                Vietnam
                            </div>
                        </div>

                        {/* Số điện thoại */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Số điện thoại:</label>
                            <div className="bg-gray-100 px-4 py-3 rounded-sm text-gray-800">
                                {user.phone || 'Chưa cập nhật'}
                            </div>
                        </div>

                        <div className="pt-6">
                            <button className="bg-black text-white px-8 py-3 text-sm font-bold uppercase hover:bg-gray-800 transition">
                                Cập nhật thông tin
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        {/* Chat Bubble */}
        <div className="fixed bottom-8 right-8 z-50">
            <button className="bg-blue-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition">
                <MessageCircle size={28} />
            </button>
        </div>
    </div>
  );
}