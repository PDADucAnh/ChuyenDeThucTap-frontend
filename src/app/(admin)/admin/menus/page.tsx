'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { menuService, Menu } from '@/services/menu.service';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { AxiosError } from 'axios';

export default function MenuPage() {
    const [menus, setMenus] = useState<Menu[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterPosition, setFilterPosition] = useState('mainmenu');

    const fetchMenus = async () => {
        try {
            // Lấy menu theo vị trí (Main Menu / Footer)
            const res = await menuService.getMenus({ position: filterPosition });
            if (res.status) {
                setMenus(res.menus);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, [filterPosition]);

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa menu này?")) return;
        try {
            await menuService.deleteMenu(id);
            alert("Xóa thành công!");
            fetchMenus();
        } catch (error) {
            const err = error as AxiosError<{message: string}>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Menu</h1>
                <Link 
                    href="/admin/menus/create" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Thêm Menu
                </Link>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex gap-4 items-center">
                <span className="text-sm font-bold text-gray-600">Vị trí:</span>
                <select 
                    value={filterPosition}
                    onChange={(e) => setFilterPosition(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
                >
                    <option value="mainmenu">Main Menu (Menu chính)</option>
                    <option value="footermenu">Footer Menu (Chân trang)</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                            <th className="px-6 py-4">Tên Menu</th>
                            <th className="px-6 py-4">Link</th>
                            <th className="px-6 py-4">Loại</th>
                            <th className="px-6 py-4">Thứ tự</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8">Đang tải...</td></tr>
                        ) : menus.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8">Không có menu nào</td></tr>
                        ) : (
                            menus.map((menu) => (
                                <tr key={menu.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-800">{menu.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{menu.link}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold 
                                            ${menu.type === 'custom' ? 'bg-purple-100 text-purple-700' : 
                                              menu.type === 'category' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {menu.type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{menu.sort_order}</td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <Link href={`/admin/menus/edit/${menu.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                            <Edit size={18} />
                                        </Link>
                                        <button onClick={() => handleDelete(menu.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}