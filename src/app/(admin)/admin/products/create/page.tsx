'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { productService, Category, Attribute, ProductAttributeInput } from '@/services/product.service';
import { Save, ArrowLeft, Upload, Plus, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AxiosError } from 'axios';

interface ProductFormInputs {
    name: string;
    category_id: string;
    price_buy: number;
    content: string;
    description: string;
    thumbnail: FileList;
    gallery: FileList; // New: Gallery images
}

export default function CreateProductPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductFormInputs>();
    
    // Data Sources
    const [categories, setCategories] = useState<Category[]>([]);
    const [attributesList, setAttributesList] = useState<Attribute[]>([]);
    
    // UI State
    const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
    const [previewGallery, setPreviewGallery] = useState<string[]>([]);
    
    // Attribute State
    const [productAttrs, setProductAttrs] = useState<ProductAttributeInput[]>([]);
    const [tempAttrId, setTempAttrId] = useState<string>('');
    const [tempAttrValue, setTempAttrValue] = useState<string>('');

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            const [catRes, attrRes] = await Promise.all([
                productService.getCategories(),
                productService.getAttributes()
            ]);
            if (catRes.status) setCategories(catRes.categories);
            if (attrRes.status) setAttributesList(attrRes.attributes);
        };
        loadData();
    }, []);

    // Handlers
    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPreviewThumbnail(URL.createObjectURL(file));
    };

    const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const urls = Array.from(files).map(file => URL.createObjectURL(file));
            setPreviewGallery(urls);
        }
    };

    const addAttribute = () => {
        if (!tempAttrId || !tempAttrValue) return;
        const attrObj = attributesList.find(a => a.id === Number(tempAttrId));
        if (!attrObj) return;

        // Add to list (Allow multiple values for same attribute? Your DB structure says 1 value per row, 
        // but for a product it can have multiple rows. Let's assume simple addition first)
        setProductAttrs([...productAttrs, { attribute_id: Number(tempAttrId), value: tempAttrValue }]);
        setTempAttrValue(''); // Reset value input
    };

    const removeAttribute = (index: number) => {
        const newAttrs = [...productAttrs];
        newAttrs.splice(index, 1);
        setProductAttrs(newAttrs);
    };

    const onSubmit = async (data: ProductFormInputs) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('category_id', data.category_id);
            formData.append('price_buy', data.price_buy.toString());
            formData.append('content', data.content);
            formData.append('description', data.description);
            formData.append('status', '1');
            
            // Thumbnail
            if (data.thumbnail && data.thumbnail[0]) {
                formData.append('thumbnail', data.thumbnail[0]);
            }

            // Gallery
            if (data.gallery && data.gallery.length > 0) {
                Array.from(data.gallery).forEach((file) => {
                    formData.append('gallery[]', file);
                });
            }

            // Attributes (Send as JSON string)
            formData.append('attributes', JSON.stringify(productAttrs));

            await productService.createProduct(formData);
            alert("Thêm sản phẩm thành công!");
            router.push('/admin/products');
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/products" className="p-2 bg-white border rounded hover:bg-gray-50">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Thêm sản phẩm mới</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* --- CỘT TRÁI: THÔNG TIN --- */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 1. Thông tin cơ bản */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Thông tin cơ bản</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên sản phẩm</label>
                                <input {...register('name', { required: true })} className="w-full border p-2 rounded" placeholder="VD: Áo Thun..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Giá bán</label>
                                    <input type="number" {...register('price_buy', { required: true })} className="w-full border p-2 rounded" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Danh mục</label>
                                    <select {...register('category_id', { required: true })} className="w-full border p-2 rounded">
                                        <option value="">-- Chọn --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                                <textarea {...register('description')} rows={3} className="w-full border p-2 rounded"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Nội dung chi tiết</label>
                                <textarea {...register('content', { required: true })} rows={6} className="w-full border p-2 rounded"></textarea>
                            </div>
                        </div>
                    </div>

                    {/* 2. Thuộc tính & Biến thể */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Thuộc tính & Biến thể</h3>
                        
                        <div className="flex gap-2 items-end mb-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Tên thuộc tính</label>
                                <select 
                                    className="w-full border p-2 rounded text-sm"
                                    value={tempAttrId}
                                    onChange={(e) => setTempAttrId(e.target.value)}
                                >
                                    <option value="">-- Chọn --</option>
                                    {attributesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Giá trị (VD: XL, Đỏ...)</label>
                                <input 
                                    type="text" 
                                    className="w-full border p-2 rounded text-sm"
                                    value={tempAttrValue}
                                    onChange={(e) => setTempAttrValue(e.target.value)}
                                    placeholder="Nhập giá trị..."
                                />
                            </div>
                            <button 
                                type="button" 
                                onClick={addAttribute}
                                className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 h-[38px]"
                            >
                                Thêm
                            </button>
                        </div>

                        {/* List Attributes */}
                        <div className="space-y-2">
                            {productAttrs.map((attr, index) => {
                                const attrName = attributesList.find(a => a.id === attr.attribute_id)?.name;
                                return (
                                    <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-200">
                                        <span className="text-sm">
                                            <span className="font-bold">{attrName}:</span> {attr.value}
                                        </span>
                                        <button type="button" onClick={() => removeAttribute(index)} className="text-red-500 hover:text-red-700">
                                            <X size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                            {productAttrs.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có thuộc tính nào.</p>}
                        </div>
                    </div>
                </div>

                {/* --- CỘT PHẢI: ẢNH --- */}
                <div className="space-y-6">
                    {/* Ảnh đại diện */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Ảnh đại diện *</h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {previewThumbnail ? (
                                <div className="relative aspect-[3/4] w-full mb-4">
                                    <Image src={previewThumbnail} alt="Thumbnail" fill className="object-cover rounded" />
                                </div>
                            ) : <div className="py-8 text-gray-400 text-sm">Chưa có ảnh</div>}
                            <label className="block">
                                <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded cursor-pointer text-sm font-bold block w-full">Chọn ảnh</span>
                                <input type="file" accept="image/*" className="hidden" {...register('thumbnail', { onChange: handleThumbnailChange })} />
                            </label>
                        </div>
                    </div>

                    {/* Album ảnh */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Album ảnh phụ</h3>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {previewGallery.map((src, idx) => (
                                <div key={idx} className="relative aspect-square border rounded overflow-hidden">
                                    <Image src={src} alt="Gallery" fill className="object-cover" />
                                </div>
                            ))}
                        </div>
                        <label className="block">
                            <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded cursor-pointer text-sm font-bold block w-full text-center border">
                                + Thêm nhiều ảnh
                            </span>
                            <input type="file" accept="image/*" multiple className="hidden" {...register('gallery', { onChange: handleGalleryChange })} />
                        </label>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-lg shadow-lg hover:bg-blue-700">
                        <Save size={20} /> LƯU SẢN PHẨM
                    </button>
                </div>
            </form>
        </div>
    );
}