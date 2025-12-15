'use client';

import { useEffect, useState } from 'react';
import { inventoryService, ProductStore } from '@/services/inventory.service';
import { productService, Product } from '@/services/product.service';
import { Plus, Package, Edit, Trash2, X, Save } from 'lucide-react';
import Image from 'next/image';
import { AxiosError } from 'axios';

export default function InventoryPage() {
    const [stocks, setStocks] = useState<ProductStore[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    // UI States
    const [showImportForm, setShowImportForm] = useState(false);
    const [editingStock, setEditingStock] = useState<ProductStore | null>(null); // State cho modal sửa

    // Form Data
    const [importData, setImportData] = useState({ product_id: '', qty: 10, price_root: 0 });
    const [editData, setEditData] = useState({ qty: 0, price_root: 0 });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [stockRes, prodRes] = await Promise.all([
                inventoryService.getInventory(),
                productService.getProducts({ limit: 1000 })
            ]);
            
            if (stockRes.status) setStocks(stockRes.data);
            if (prodRes.status) setProducts(prodRes.products.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 1. NHẬP KHO (Import)
    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inventoryService.importStock({
                product_id: Number(importData.product_id),
                qty: Number(importData.qty),
                price_root: Number(importData.price_root)
            });
            alert("Nhập kho thành công!");
            setShowImportForm(false);
            fetchData(); 
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    // 2. CẬP NHẬT KHO (Update)
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStock) return;
        try {
            await inventoryService.updateStock(editingStock.id, editData);
            alert("Cập nhật thành công!");
            setEditingStock(null);
            fetchData();
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    // 3. XÓA KHO (Delete)
    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa dòng kho này?")) return;
        try {
            await inventoryService.deleteStock(id);
            alert("Xóa thành công!");
            fetchData();
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    // Mở modal sửa
    const openEditModal = (stock: ProductStore) => {
        setEditingStock(stock);
        setEditData({ qty: stock.qty, price_root: stock.price_root });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý nhập kho</h1>
                <button 
                    onClick={() => setShowImportForm(!showImportForm)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-green-700 transition"
                >
                    <Plus size={18} /> Tạo phiếu nhập
                </button>
            </div>

            {/* FORM NHẬP KHO (Toggle) */}
            {showImportForm && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-green-200 mb-8 animate-fadeIn">
                    <h3 className="font-bold text-lg mb-4 text-green-800">Nhập hàng mới</h3>
                    <form onSubmit={handleImport} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium mb-1">Sản phẩm</label>
                            <select 
                                className="w-full border p-2 rounded"
                                required
                                onChange={(e) => setImportData({...importData, product_id: e.target.value})}
                            >
                                <option value="">-- Chọn sản phẩm --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Giá nhập (VNĐ)</label>
                            <input type="number" className="w-full border p-2 rounded" required min="0"
                                value={importData.price_root}
                                onChange={(e) => setImportData({...importData, price_root: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Số lượng nhập</label>
                            <input type="number" className="w-full border p-2 rounded" required min="1"
                                value={importData.qty}
                                onChange={(e) => setImportData({...importData, qty: Number(e.target.value)})}
                            />
                        </div>
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded font-bold hover:bg-green-700 h-[42px]">
                            Xác nhận nhập
                        </button>
                    </form>
                </div>
            )}

            {/* MODAL SỬA (Overlay) */}
            {editingStock && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Cập nhật kho: {editingStock.product_name}</h3>
                            <button onClick={() => setEditingStock(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Giá vốn (VNĐ)</label>
                                <input type="number" className="w-full border p-2 rounded" required min="0"
                                    value={editData.price_root}
                                    onChange={(e) => setEditData({...editData, price_root: Number(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Số lượng tồn kho</label>
                                <input type="number" className="w-full border p-2 rounded" required min="0"
                                    value={editData.qty}
                                    onChange={(e) => setEditData({...editData, qty: Number(e.target.value)})}
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2">
                                    <Save size={18}/> Lưu thay đổi
                                </button>
                                <button type="button" onClick={() => setEditingStock(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* BẢNG TỒN KHO */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Sản phẩm</th>
                            <th className="px-6 py-4">Giá nhập (Vốn)</th>
                            <th className="px-6 py-4">Tồn kho</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-8">Đang tải...</td></tr>
                        ) : stocks.map((item) => {
                            let imageUrl = null;
                            if (item.product_image) {
                                const rawImg = item.product_image.trim();
                                if (rawImg.startsWith('http') || rawImg.startsWith('https')) {
                                    imageUrl = rawImg;
                                } else {
                                    imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${rawImg}`;
                                }
                            }

                            return (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">#{item.id}</td>
                                    <td className="px-6 py-4 font-medium flex items-center gap-3">
                                        <div className="w-10 h-10 relative bg-gray-100 rounded overflow-hidden border flex-shrink-0">
                                             {imageUrl ? (
                                                 <Image src={imageUrl} alt={item.product_name || ""} fill className="object-cover"/>
                                             ) : <Package className="p-2 text-gray-400 w-full h-full"/>}
                                        </div>
                                        <span className="truncate max-w-[200px]" title={item.product_name}>{item.product_name}</span>
                                    </td>
                                    <td className="px-6 py-4 text-red-600 font-medium">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price_root)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.qty < 10 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {item.qty}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => openEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Sửa kho">
                                            <Edit size={18}/>
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Xóa">
                                            <Trash2 size={18}/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}