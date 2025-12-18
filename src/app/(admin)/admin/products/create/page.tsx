'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { productService, Category, Attribute } from '@/services/product.service';
import { Save, ArrowLeft, Upload, Plus, Trash2, X, Image as ImageIcon } from 'lucide-react';
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
    gallery: FileList;
    status: boolean;
}

// Helper type for the grouped attribute UI
interface AttributeRow {
    tempId: number;
    attributeId: string;
    values: string[];
    inputValue: string;
}

export default function CreateProductPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<ProductFormInputs>({
        defaultValues: { status: true }
    });
    
    // Data
    const [categories, setCategories] = useState<Category[]>([]);
    const [attributesList, setAttributesList] = useState<Attribute[]>([]);
    
    // UI State
    const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
    const [previewGallery, setPreviewGallery] = useState<string[]>([]);
    const status = watch('status');

    // Attribute Management State
    const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([
        { tempId: Date.now(), attributeId: '', values: [], inputValue: '' }
    ]);

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

    // --- HANDLERS ---

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

    // Attribute Logic
    const addAttributeRow = () => {
        setAttributeRows([...attributeRows, { tempId: Date.now(), attributeId: '', values: [], inputValue: '' }]);
    };

    const removeAttributeRow = (index: number) => {
        const newRows = [...attributeRows];
        newRows.splice(index, 1);
        setAttributeRows(newRows);
    };

    const updateRowAttribute = (index: number, attrId: string) => {
        const newRows = [...attributeRows];
        newRows[index].attributeId = attrId;
        setAttributeRows(newRows);
    };

    const handleValueKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = attributeRows[index].inputValue.trim();
            if (val && !attributeRows[index].values.includes(val)) {
                const newRows = [...attributeRows];
                newRows[index].values.push(val);
                newRows[index].inputValue = '';
                setAttributeRows(newRows);
            }
        }
    };

    const removeValueTag = (rowIndex: number, tagIndex: number) => {
        const newRows = [...attributeRows];
        newRows[rowIndex].values.splice(tagIndex, 1);
        setAttributeRows(newRows);
    };

    // Main Submit
    const onSubmit = async (data: ProductFormInputs) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('category_id', data.category_id);
            formData.append('price_buy', data.price_buy.toString());
            formData.append('content', data.content);
            formData.append('description', data.description || '');
            formData.append('status', data.status ? '1' : '0');
            
            if (data.thumbnail && data.thumbnail[0]) {
                formData.append('thumbnail', data.thumbnail[0]);
            }

            if (data.gallery && data.gallery.length > 0) {
                Array.from(data.gallery).forEach((file) => {
                    formData.append('gallery[]', file);
                });
            }

            const flatAttributes = attributeRows.flatMap(row => 
                row.attributeId && row.values.length > 0 
                    ? row.values.map(val => ({ attribute_id: Number(row.attributeId), value: val }))
                    : []
            );
            
            formData.append('attributes', JSON.stringify(flatAttributes));

            await productService.createProduct(formData);
            alert("Thêm sản phẩm thành công!");
            router.push('/admin/products');
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="p-2 bg-white border rounded hover:bg-gray-50 text-gray-600">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-800">Thêm sản phẩm mới</h1>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3">
                    <button type="button" className="px-4 py-2 bg-white border rounded text-gray-600 font-medium hover:bg-gray-50">Hủy</button>
                    <button 
                        onClick={handleSubmit(onSubmit)} 
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
                    >
                        {isSubmitting ? 'Đang lưu...' : <><Save size={18}/> Lưu sản phẩm</>}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- LEFT COLUMN --- */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* 1. General Info */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Thông tin chung</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700">Tên sản phẩm</label>
                                <input {...register('name', { required: true })} className="w-full border border-gray-300 px-4 py-2 rounded focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition" placeholder="VD: Áo Thun Polo..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Giá bán (VNĐ)</label>
                                    <input type="number" {...register('price_buy', { required: true })} className="w-full border border-gray-300 px-4 py-2 rounded focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700">Danh mục</label>
                                    <select {...register('category_id', { required: true })} className="w-full border border-gray-300 px-4 py-2 rounded focus:ring-2 focus:ring-blue-100 outline-none bg-white">
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Detailed Content */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-800 mb-2">Nội dung chi tiết</label>
                        <div className="border border-gray-300 rounded-md overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-3 text-gray-600">
                                <span className="font-bold cursor-pointer hover:text-black">B</span>
                                <span className="italic cursor-pointer hover:text-black">I</span>
                                <span className="underline cursor-pointer hover:text-black">U</span>
                                <span className="cursor-pointer hover:text-black">Link</span>
                                <span className="cursor-pointer hover:text-black">Image</span>
                            </div>
                            <textarea 
                                {...register('content', { required: true })} 
                                rows={8} 
                                className="w-full p-4 outline-none resize-y"
                                placeholder="Nhập mô tả chi tiết sản phẩm..."
                            ></textarea>
                        </div>
                        <div className="mt-4">
                             <label className="block text-sm font-medium mb-1 text-gray-700">Mô tả ngắn</label>
                             <textarea {...register('description')} rows={2} className="w-full border border-gray-300 px-4 py-2 rounded focus:ring-2 focus:ring-blue-100 outline-none"></textarea>
                        </div>
                    </div>

                    {/* 3. Attributes & Variations */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="font-bold text-gray-800">Thuộc tính & Biến thể</h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="accent-blue-600 w-4 h-4" defaultChecked />
                                <span className="text-sm text-gray-600">Sản phẩm có nhiều phiên bản</span>
                            </label>
                        </div>

                        <div className="space-y-4">
                            {attributeRows.map((row, index) => (
                                <div key={row.tempId} className="p-4 bg-gray-50 rounded-md border border-gray-200 relative group">
                                    <button 
                                        type="button" 
                                        onClick={() => removeAttributeRow(index)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tên thuộc tính</label>
                                            <select 
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                                                value={row.attributeId}
                                                onChange={(e) => updateRowAttribute(index, e.target.value)}
                                            >
                                                <option value="">-- Chọn --</option>
                                                {attributesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giá trị (Nhấn Enter để thêm)</label>
                                            <div className="w-full border border-gray-300 rounded px-3 py-2 bg-white flex flex-wrap gap-2 min-h-[42px]">
                                                {row.values.map((val, vIdx) => (
                                                    <span key={vIdx} className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                                        {val}
                                                        <button 
                                                            type="button" 
                                                            onClick={() => removeValueTag(index, vIdx)}
                                                            className="hover:text-red-600"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                ))}
                                                <input 
                                                    type="text" 
                                                    className="flex-1 outline-none text-sm bg-transparent min-w-[100px]"
                                                    placeholder={row.values.length === 0 ? "Nhập giá trị..." : ""}
                                                    value={row.inputValue}
                                                    onChange={(e) => {
                                                        const newRows = [...attributeRows];
                                                        newRows[index].inputValue = e.target.value;
                                                        setAttributeRows(newRows);
                                                    }}
                                                    onKeyDown={(e) => handleValueKeyDown(index, e)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button 
                                type="button" 
                                onClick={addAttributeRow}
                                className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline mt-2"
                            >
                                <Plus size={16} /> Thêm thuộc tính khác
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="space-y-6">
                    
                    {/* 1. Thumbnail (FIXED BUG HERE) */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">Ảnh đại diện</h3>
                        {/* FIX: Added 'relative' class below */}
                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition bg-gray-50">
                            {previewThumbnail ? (
                                <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-sm">
                                    <Image src={previewThumbnail} alt="Thumbnail" fill className="object-cover" />
                                    <button 
                                        type="button" 
                                        onClick={() => setPreviewThumbnail(null)} 
                                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow hover:text-red-500"
                                    >
                                        <X size={14}/>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                                    <div className="bg-gray-200 p-3 rounded-full mb-3">
                                        <Upload size={24} className="text-gray-500" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600">Nhấn để tải lên</p>
                                    <p className="text-xs">hoặc kéo thả PNG, JPG</p>
                                </div>
                            )}
                            
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                {...register('thumbnail', { onChange: handleThumbnailChange })} 
                            />
                        </div>
                    </div>

                    {/* 2. Status Toggle */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
                        <span className="font-bold text-gray-800">Hiển thị</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                {...register('status')} 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* 3. Gallery */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">Album ảnh phụ</h3>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {previewGallery.map((src, idx) => (
                                <div key={idx} className="relative aspect-square border rounded-md overflow-hidden">
                                    <Image src={src} alt="Gallery" fill className="object-cover" />
                                </div>
                            ))}
                            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-400 hover:text-blue-500 hover:border-blue-300">
                                <ImageIcon size={20} />
                                <span className="text-[10px] mt-1 font-bold">+ Thêm</span>
                                <input type="file" accept="image/*" multiple className="hidden" {...register('gallery', { onChange: handleGalleryChange })} />
                            </label>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}