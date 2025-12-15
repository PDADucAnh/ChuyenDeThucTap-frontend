'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Trash2, ImageIcon } from 'lucide-react';
import { bannerService, Banner } from '@/services/banner.service';
import { AxiosError } from 'axios';

export default function BannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await bannerService.getAll();
            if (res.status) {
                setBanners(res.banners);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa banner này?")) return;
        try {
            await bannerService.delete(id);
            alert("Xóa thành công!");
            fetchBanners();
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Banner</h1>
                <Link 
                    href="/admin/banners/create" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Thêm Banner
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                            <th className="px-6 py-4">Hình ảnh</th>
                            <th className="px-6 py-4">Tên Banner</th>
                            <th className="px-6 py-4">Vị trí</th>
                            <th className="px-6 py-4">Thứ tự</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8">Đang tải...</td></tr>
                        ) : banners.map((banner) => (
                            <tr key={banner.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="w-32 h-16 relative bg-gray-100 rounded overflow-hidden border">
                                        {banner.image_url ? (
                                            <Image 
                                                src={banner.image_url} 
                                                alt={banner.name} 
                                                fill 
                                                className="object-cover" 
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{banner.name}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                        ${banner.position === 'slideshow' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {banner.position}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{banner.sort_order}</td>
                                <td className="px-6 py-4">
                                    {banner.status === 1 ? 
                                        <span className="text-green-600 font-bold text-xs">Hiển thị</span> : 
                                        <span className="text-gray-400 font-bold text-xs">Ẩn</span>
                                    }
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <Link href={`/admin/banners/edit/${banner.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                        <Edit size={18}/>
                                    </Link>
                                    <button onClick={() => handleDelete(banner.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}