'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import AdminSidebar from '@/components/layout/AdminSidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Logic kiểm tra quyền (Uncomment khi cần kích hoạt bảo vệ chặt chẽ)
        if (!user || user.roles !== 'admin') {
            // router.push('/'); 
        }

        // FIX LỖI: Dùng setTimeout để tránh lỗi 'setState synchronously'
        // Đẩy việc tắt loading xuống cuối hàng đợi task
        const timer = setTimeout(() => {
            setIsChecking(false);
        }, 0);

        return () => clearTimeout(timer);
    }, [user, router]);

    if (isChecking) {
        return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar cố định bên trái */}
            <AdminSidebar />

            {/* Khu vực nội dung chính bên phải */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Admin Header */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
                    <h2 className="font-semibold text-gray-700">Dashboard Quản Trị</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Xin chào, {user?.name || 'Admin'}</span>
                        {/* Avatar nhỏ */}
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
