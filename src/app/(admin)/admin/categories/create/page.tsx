'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { categoryService } from '@/services/category.service';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { AxiosError } from 'axios';

interface CategoryFormInputs {
    name: string;
    parent_id: string;
    sort_order: number;
    description: string;
    status: number;
    image: FileList;
}

export default function CreateCategoryPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CategoryFormInputs>({
        defaultValues: { sort_order: 0, status: 1 }
    });

    const onSubmit = async (data: CategoryFormInputs) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('sort_order', data.sort_order.toString());
            formData.append('description', data.description);
            formData.append('status', data.status.toString());
            // formData.append('parent_id', data.parent_id); // Nếu có cấp cha

            if (data.image && data.image[0]) {
                formData.append('image', data.image[0]);
            }

            await categoryService.create(formData);
            alert("Thêm danh mục thành công!");
            router.push('/admin/categories');
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/categories" className="p-2 bg-white border rounded hover:bg-gray-50">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Thêm danh mục mới</h1>
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
                        <label className="block text-sm font-medium mb-1">Hình ảnh (Tùy chọn)</label>
                        <input type="file" accept="image/*" {...register('image')} />
                    </div>
                </div>

                <div className="mt-8">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                        <Save size={18} /> Lưu danh mục
                    </button>
                </div>
            </form>
        </div>
    );
}