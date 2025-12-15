'use client';

import { useEffect, useState } from 'react';
import { promotionService, Promotion } from '@/services/promotion.service';
import { productService, Product } from '@/services/product.service';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { AxiosError } from 'axios';

// Hàm định dạng ngày tháng cho input datetime-local
const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    // Format: YYYY-MM-DDTHH:mm
    return date.toISOString().slice(0, 16);
};

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingPromo, setEditingPromo] = useState<Promotion | null>(null); // State đang sửa

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        product_id: '',
        price_sale: 0,
        date_begin: '',
        date_end: ''
    });

    const fetchData = async () => {
        const [promoRes, prodRes] = await Promise.all([
            promotionService.getPromotions(),
            productService.getProducts({ limit: 1000 })
        ]);
        if (promoRes.status) setPromotions(promoRes.data);
        if (prodRes.status) setProducts(prodRes.products.data);
    };

    useEffect(() => {
        const timer = setTimeout(() => { fetchData(); }, 0);
        return () => clearTimeout(timer);
    }, []);

    // Reset form
    const resetForm = () => {
        setFormData({ name: '', product_id: '', price_sale: 0, date_begin: '', date_end: '' });
        setEditingPromo(null);
    };

    // Mở form thêm mới
    const handleOpenCreate = () => {
        resetForm();
        setShowForm(true);
    };

    // Mở form chỉnh sửa
    const handleEdit = (promo: Promotion) => {
        setEditingPromo(promo);
        setFormData({
            name: promo.name,
            product_id: promo.product_id.toString(),
            price_sale: promo.price_sale,
            date_begin: formatDateForInput(promo.date_begin),
            date_end: formatDateForInput(promo.date_end)
        });
        setShowForm(true);
        // Scroll lên form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Xử lý Submit (Create hoặc Update)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                name: formData.name,
                product_id: Number(formData.product_id),
                price_sale: Number(formData.price_sale),
                date_begin: formData.date_begin,
                date_end: formData.date_end
            };

            if (editingPromo) {
                // Cập nhật
                await promotionService.updatePromotion(editingPromo.id, payload);
                alert("Cập nhật thành công!");
            } else {
                // Tạo mới
                await promotionService.createPromotion(payload);
                alert("Tạo khuyến mãi thành công!");
            }
            
            setShowForm(false);
            resetForm();
            fetchData();
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    // Xử lý Xóa
    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa khuyến mãi này?")) return;
        try {
            await promotionService.deletePromotion(id);
            alert("Đã xóa thành công!");
            fetchData();
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý khuyến mãi</h1>
                <button 
                    onClick={handleOpenCreate}
                    className="bg-orange-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-orange-700 transition"
                >
                    <Plus size={18} /> Thêm đợt giảm giá
                </button>
            </div>

            {/* FORM TẠO/SỬA KM */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-orange-200 mb-8 animate-fadeIn">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-orange-800">
                            {editingPromo ? 'Cập nhật khuyến mãi' : 'Thiết lập giảm giá mới'}
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">Đóng</button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1">Tên chương trình</label>
                            <input type="text" className="w-full border p-2 rounded" required 
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Sản phẩm áp dụng</label>
                            <select className="w-full border p-2 rounded" required
                                value={formData.product_id}
                                onChange={e => setFormData({...formData, product_id: e.target.value})}
                            >
                                <option value="">-- Chọn sản phẩm --</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} - Giá: {p.price_buy}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Giá khuyến mãi (Sau giảm)</label>
                            <input type="number" className="w-full border p-2 rounded" required 
                                value={formData.price_sale}
                                onChange={e => setFormData({...formData, price_sale: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                            <input type="datetime-local" className="w-full border p-2 rounded" required 
                                value={formData.date_begin}
                                onChange={e => setFormData({...formData, date_begin: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                            <input type="datetime-local" className="w-full border p-2 rounded" required 
                                value={formData.date_end}
                                onChange={e => setFormData({...formData, date_end: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                            <button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded font-bold hover:bg-orange-700">
                                {editingPromo ? 'Lưu thay đổi' : 'Lưu khuyến mãi'}
                            </button>
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Hủy</button>
                        </div>
                    </form>
                </div>
            )}

            {/* DANH SÁCH KM */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                            <th className="px-6 py-4">Tên chương trình</th>
                            <th className="px-6 py-4">Sản phẩm</th>
                            <th className="px-6 py-4">Giá giảm còn</th>
                            <th className="px-6 py-4">Thời gian</th>
                            <th className="px-6 py-4">Trạng thái</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {promotions.map((item) => {
                            const isActive = new Date(item.date_end) > new Date();
                            return (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                                    <td className="px-6 py-4">{item.product_name}</td>
                                    <td className="px-6 py-4 text-orange-600 font-bold">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price_sale)}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        <div>BĐ: {new Date(item.date_begin).toLocaleDateString()}</div>
                                        <div>KT: {new Date(item.date_end).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                            {isActive ? 'Đang chạy' : 'Kết thúc'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Sửa">
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