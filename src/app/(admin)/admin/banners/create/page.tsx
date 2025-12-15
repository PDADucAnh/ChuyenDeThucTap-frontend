'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { bannerService, BannerPayload } from '@/services/banner.service';
import { Save, ArrowLeft, Upload, LucideProps } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AxiosError } from 'axios';

export default function CreateBannerPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<BannerPayload>({
        defaultValues: { position: 'slideshow', status: '1', sort_order: 0 }
    });
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPreviewImage(URL.createObjectURL(file));
    };

    const onSubmit = async (data: BannerPayload) => {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            formData.append('link', data.link || '');
            formData.append('position', data.position);
            formData.append('sort_order', data.sort_order?.toString() || '0');
            formData.append('description', data.description || '');
            formData.append('status', data.status);

            if (data.image && data.image[0]) {
                formData.append('image', data.image[0]);
            }

            await bannerService.create(formData);
            alert("Thêm banner thành công!");
            router.push('/admin/banners');
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/banners" className="p-2 bg-white border rounded hover:bg-gray-50">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Thêm Banner Mới</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* TRÁI */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tên Banner</label>
                                <input {...register('name', { required: "Nhập tên banner" })} className="w-full border p-2 rounded" />
                                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Liên kết (Link)</label>
                                <input {...register('link')} className="w-full border p-2 rounded" placeholder="/products/..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vị trí</label>
                                    <select {...register('position')} className="w-full border p-2 rounded">
                                        <option value="slideshow">Slideshow (Trang chủ)</option>
                                        <option value="ads">Quảng cáo (Ads)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Thứ tự</label>
                                    <input type="number" {...register('sort_order')} className="w-full border p-2 rounded" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả</label>
                                <textarea {...register('description')} rows={3} className="w-full border p-2 rounded"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PHẢI */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Hình ảnh</h3>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {previewImage ? (
                                <div className="relative aspect-video w-full mb-4">
                                    <Image src={previewImage} alt="Preview" fill className="object-cover rounded" />
                                </div>
                            ) : (
                                <div className="py-8 text-gray-400"><ImageIcon className="mx-auto mb-2"/>Chưa có ảnh</div>
                            )}
                            <label className="block">
                                <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded cursor-pointer text-sm font-bold">Chọn hình ảnh</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    {...register('image', { 
                                        required: "Vui lòng chọn ảnh",
                                        onChange: handleImageChange 
                                    })} 
                                />
                            </label>
                             {errors.image && <span className="text-red-500 text-xs block mt-2">{errors.image.message}</span>}
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                        <Save size={20} /> Lưu Banner
                    </button>
                </div>
            </form>
        </div>
    );
}

// FIX: Use LucideProps instead of any
function ImageIcon(props: LucideProps) {
    return <Upload {...props} />
}