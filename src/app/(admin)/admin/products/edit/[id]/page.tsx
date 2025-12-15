'use client';

import { useState, useEffect, use } from 'react'; // use để unwrap params
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { productService, Category, Product } from '@/services/product.service';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AxiosError } from 'axios';

// Interface cho form
interface ProductFormInputs {
    name: string;
    category_id: string; 
    price_buy: number;
    content: string;
    description: string;
    thumbnail: FileList | null; // Có thể null nếu không chọn ảnh mới
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: PageProps) {
    const { id } = use(params); // Unwrap params
    const router = useRouter();
    
    // Form Hook
    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormInputs>();
    
    // State
    const [categories, setCategories] = useState<Category[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Load danh mục & Dữ liệu sản phẩm cũ
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Gọi API lấy danh mục
                const catRes = await productService.getCategories();
                if (catRes.status) setCategories(catRes.categories);

                // Gọi API lấy chi tiết sản phẩm cần sửa
                const prodRes = await productService.getProductBySlug(id); 
                
                if (prodRes && prodRes.product) {
                    const prod = prodRes.product;
                    setCurrentProduct(prod);
                    
                    // Đổ dữ liệu cũ vào form
                    setValue('name', prod.name);
                    setValue('category_id', prod.category?.id.toString() || '');
                    setValue('price_buy', Number(prod.price_buy));
                    setValue('description', prod.description);
                    setValue('content', prod.content || '');
                    
                    // Hiển thị ảnh cũ
                    if (prod.thumbnail) {
                        setPreviewImage(prod.thumbnail.startsWith('http') 
                            ? prod.thumbnail 
                            : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${prod.thumbnail}`);
                    }
                }
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
                alert("Không tìm thấy sản phẩm hoặc lỗi kết nối.");
                router.push('/admin/products');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, setValue, router]);

    // Xử lý chọn ảnh mới
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    // Submit Cập nhật
    const onSubmit = async (data: ProductFormInputs) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('category_id', data.category_id);
            formData.append('price_buy', data.price_buy.toString());
            formData.append('content', data.content);
            formData.append('description', data.description);
            // formData.append('status', '1'); // Giữ nguyên hoặc thêm field status nếu cần

            // Chỉ gửi ảnh nếu người dùng chọn ảnh mới
            if (data.thumbnail && data.thumbnail[0]) {
                formData.append('thumbnail', data.thumbnail[0]);
            }

            // Gọi API Update
            await productService.updateProduct(Number(id), formData);
            
            alert("Cập nhật sản phẩm thành công!");
            router.push('/admin/products');
        } catch (error) {
            // FIX BUG: Định nghĩa kiểu dữ liệu rõ ràng thay vì 'any'
            const err = error as AxiosError<{ message: string, errors?: Record<string, string[]> }>;
            console.error(err);
            
            if (err.response?.data?.errors) {
                // Lấy thông báo lỗi đầu tiên từ object errors
                const errors = err.response.data.errors;
                const firstKey = Object.keys(errors)[0];
                const firstMessage = errors[firstKey][0];
                alert(`Lỗi dữ liệu: ${firstMessage}`);
            } else {
                alert("Lỗi: " + (err.response?.data?.message || "Không thể cập nhật sản phẩm"));
            }
        }
    };

    if (loading) return <div className="text-center py-20">Đang tải dữ liệu...</div>;

    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/products" className="p-2 bg-white border rounded hover:bg-gray-50">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Cập nhật sản phẩm: <span className="text-blue-600">#{id}</span></h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* CỘT TRÁI */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Thông tin cơ bản</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                                <input 
                                    {...register('name', { required: "Tên sản phẩm là bắt buộc" })}
                                    className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                                    placeholder="Nhập tên sản phẩm..."
                                />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ)</label>
                                    <input 
                                        type="number"
                                        {...register('price_buy', { required: true })}
                                        className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                                    <select 
                                        {...register('category_id', { required: true })}
                                        className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">-- Chọn danh mục --</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                                <textarea 
                                    {...register('description')}
                                    rows={3}
                                    className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung chi tiết</label>
                                <textarea 
                                    {...register('content', { required: true })}
                                    rows={6}
                                    className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Hình ảnh</h3>
                        
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {previewImage ? (
                                <div className="relative aspect-[3/4] w-full mb-4">
                                    <Image src={previewImage} alt="Preview" fill className="object-cover rounded" />
                                </div>
                            ) : (
                                <div className="py-8 text-gray-400">
                                    <Upload className="mx-auto mb-2" size={32} />
                                    <span className="text-sm">Chưa có ảnh</span>
                                </div>
                            )}
                            
                            <label className="block">
                                <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded cursor-pointer hover:bg-blue-100 transition text-sm font-bold">
                                    {previewImage ? 'Thay đổi ảnh' : 'Chọn hình ảnh'}
                                </span>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    className="hidden"
                                    {...register('thumbnail', { 
                                        onChange: handleImageChange // Không required vì update có thể giữ ảnh cũ
                                    })}
                                />
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold uppercase hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Đang lưu...' : <><Save size={20} /> Cập nhật sản phẩm</>}
                    </button>
                </div>

            </form>
        </div>
    );
}