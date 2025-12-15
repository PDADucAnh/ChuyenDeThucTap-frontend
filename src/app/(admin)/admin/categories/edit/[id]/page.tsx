'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { categoryService } from '@/services/category.service';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AxiosError } from 'axios';

interface CategoryFormInputs {
    name: string;
    sort_order: number;
    description: string;
    status: number;
    image: FileList;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditCategoryPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CategoryFormInputs>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await categoryService.getById(Number(id));
                if (res.status && res.category) {
                    const cat = res.category;
                    setValue('name', cat.name);
                    setValue('sort_order', cat.sort_order);
                    setValue('description', cat.description || '');
                    setValue('status', cat.status);
                }
            } catch (error) {
                console.error(error);
                router.push('/admin/categories');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id, setValue, router]);

    const onSubmit = async (data: CategoryFormInputs) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('sort_order', data.sort_order.toString());
            formData.append('description', data.description);
            
            if (data.image && data.image[0]) {
                formData.append('image', data.image[0]);
            }

            await categoryService.update(Number(id), formData);
            alert("Cập nhật thành công!");
            router.push('/admin/categories');
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div>Đang tải...</div>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/categories" className="p-2 bg-white border rounded hover:bg-gray-50">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Cập nhật danh mục</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl bg-white p-8 rounded-lg shadow-sm border border-gray-100">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tên danh mục</label>
                        <input 
                            {...register('name', { required: "Vui lòng nhập tên danh mục" })}
                            className="w-full border border-gray-300 px-4 py-2 rounded"
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Thứ tự sắp xếp</label>
                        <input 
                            type="number"
                            {...register('sort_order')}
                            className="w-full border border-gray-300 px-4 py-2 rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Mô tả</label>
                        <textarea 
                            {...register('description')}
                            rows={3}
                            className="w-full border border-gray-300 px-4 py-2 rounded"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Hình ảnh (Chọn để thay đổi)</label>
                        <input type="file" accept="image/*" {...register('image')} />
                    </div>
                </div>

                <div className="mt-8">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Cập nhật
                    </button>
                </div>
            </form>
        </div>
    );
}