'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { menuService } from '@/services/menu.service';
import { productService, Category } from '@/services/product.service'; // Lấy Category
import { topicService, Topic } from '@/services/topic.service'; // Lấy Topic
import { postService, Post } from '@/services/post.service'; // Lấy Page
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AxiosError } from 'axios';

interface MenuFormInputs {
    name: string;
    link: string;
    type: string;
    table_id: string; // Keep as string for form input compatibility
    position: string;
    sort_order: number;
    status: number;
    parent_id: number; // Add missing fields to match MenuPayload requirements
}

export default function CreateMenuPage() {
    const router = useRouter();
    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<MenuFormInputs>({
        defaultValues: { type: 'custom', position: 'mainmenu', status: 1, sort_order: 0, parent_id: 0, table_id: '0' }
    });

    // Data Sources
    const [categories, setCategories] = useState<Category[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [pages, setPages] = useState<Post[]>([]);

    // Watchers
    const selectedType = watch('type');

    // Load Data Sources
    useEffect(() => {
        const loadData = async () => {
            if (selectedType === 'category' && categories.length === 0) {
                const res = await productService.getCategories();
                if (res.status) setCategories(res.categories);
            }
            if (selectedType === 'topic' && topics.length === 0) {
                const res = await topicService.getAll();
                if (res.status) setTopics(res.topics);
            }
            if (selectedType === 'page' && pages.length === 0) {
                const res = await postService.getPages();
                if (res.status) setPages(res.posts);
            }
        };
        loadData();
    }, [selectedType, categories.length, topics.length, pages.length]);

    // Handle Source Selection
    const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = Number(e.target.value);
        if (!id) return;

        // FIX: Explicitly type selectedItem instead of 'any'
        let selectedItem: (Category | Topic | Post) | undefined;
        let linkPrefix = '';

        if (selectedType === 'category') {
            selectedItem = categories.find(c => c.id === id);
            linkPrefix = '/products?category=';
        } else if (selectedType === 'topic') {
            selectedItem = topics.find(t => t.id === id);
            linkPrefix = '/posts?topic=';
        } else if (selectedType === 'page') {
            selectedItem = pages.find(p => p.id === id);
            linkPrefix = '/page/';
        }

        if (selectedItem) {
            // Check properties safely
            const itemName = 'name' in selectedItem ? selectedItem.name : selectedItem.title;
            
            setValue('name', itemName);
            setValue('link', selectedItem.slug ? `${linkPrefix}${selectedItem.slug}` : '');
            setValue('table_id', id.toString());
        }
    };

    const onSubmit = async (data: MenuFormInputs) => {
        try {
            // FIX: Convert table_id from string to number to match MenuPayload
            await menuService.createMenu({
                ...data,
                table_id: Number(data.table_id)
            });
            alert("Thêm menu thành công!");
            router.push('/admin/menus');
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/menus" className="p-2 bg-white border rounded hover:bg-gray-50">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Thêm Menu Mới</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                
                {/* 1. Chọn loại Menu */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Loại Menu</label>
                    <div className="grid grid-cols-4 gap-4">
                        {['custom', 'category', 'topic', 'page'].map(type => (
                            <label key={type} className={`border p-3 rounded text-center cursor-pointer uppercase text-xs font-bold transition
                                ${selectedType === type ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50'}`}>
                                <input 
                                    type="radio" 
                                    value={type} 
                                    {...register('type')} 
                                    className="hidden"
                                />
                                {type}
                            </label>
                        ))}
                    </div>
                </div>

                {/* 2. Chọn Nguồn (Nếu không phải Custom) */}
                {selectedType !== 'custom' && (
                    <div className="mb-6 animate-fadeIn">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Chọn nguồn dữ liệu</label>
                        <select 
                            className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                            onChange={handleSourceChange}
                        >
                            <option value="">-- Chọn {selectedType} --</option>
                            {selectedType === 'category' && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            {selectedType === 'topic' && topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            {selectedType === 'page' && pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                        </select>
                    </div>
                )}

                {/* 3. Thông tin chi tiết */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tên hiển thị</label>
                        <input 
                            {...register('name', { required: "Vui lòng nhập tên menu" })}
                            className="w-full border border-gray-300 px-4 py-2 rounded"
                            placeholder="Ví dụ: Trang chủ"
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Đường dẫn (Link)</label>
                        <input 
                            {...register('link', { required: "Vui lòng nhập đường dẫn" })}
                            className="w-full border border-gray-300 px-4 py-2 rounded bg-gray-50"
                            placeholder="/products/..."
                            // readOnly={selectedType !== 'custom'} // Có thể cho sửa hoặc không
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Vị trí</label>
                            <select {...register('position')} className="w-full border border-gray-300 px-4 py-2 rounded">
                                <option value="mainmenu">Main Menu</option>
                                <option value="footermenu">Footer Menu</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Thứ tự sắp xếp</label>
                            <input 
                                type="number" 
                                {...register('sort_order')}
                                className="w-full border border-gray-300 px-4 py-2 rounded"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Lưu Menu
                    </button>
                </div>
            </form>
        </div>
    );
}