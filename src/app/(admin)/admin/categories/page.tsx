'use client';

import { useEffect, useState } from 'react';
import { List, Plus, Edit, Trash2 } from 'lucide-react';
import { categoryService, Category } from '@/services/category.service';
import Link from 'next/link';
import { AxiosError } from 'axios';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    
    const fetchCategories = async () => {
        try {
            const res = await categoryService.getAll();
            if (res.status) setCategories(res.categories);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
        try {
            await categoryService.delete(id);
            alert("Xóa thành công!");
            fetchCategories(); // Reload lại danh sách
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý danh mục</h1>
                <Link 
                    href="/admin/categories/create"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={18} /> Thêm danh mục
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Tên danh mục</th>
                            <th className="px-6 py-4">Slug</th>
                            <th className="px-6 py-4">Thứ tự</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8">Đang tải...</td></tr>
                        ) : categories.map((cat) => (
                            <tr key={cat.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">#{cat.id}</td>
                                <td className="px-6 py-4 font-bold text-gray-800">{cat.name}</td>
                                <td className="px-6 py-4 text-gray-500">{cat.slug}</td>
                                <td className="px-6 py-4">{cat.sort_order}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <Link href={`/admin/categories/edit/${cat.id}`} className="text-blue-600 hover:bg-blue-50 p-2 rounded">
                                        <Edit size={18}/>
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(cat.id)}
                                        className="text-red-600 hover:bg-red-50 p-2 rounded"
                                    >
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