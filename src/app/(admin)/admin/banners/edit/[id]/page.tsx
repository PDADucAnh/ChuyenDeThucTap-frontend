'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { bannerService, BannerPayload } from '@/services/banner.service';
import { Save, ArrowLeft, Upload, LucideProps } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AxiosError } from 'axios';

interface PageProps { params: Promise<{ id: string }> }

export default function EditBannerPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    
    // FIX 1: Use 'reset' to populate form data cleanly
    const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<BannerPayload>({
        defaultValues: { status: '1' } 
    });
    
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const res = await bannerService.getById(Number(id));
                if (res.status && res.banner) {
                    const b = res.banner;
                    
                    // FIX 2: Use reset() to populate all fields at once
                    // Ensure values are strings where necessary for inputs
                    reset({
                        name: b.name,
                        link: b.link || '',
                        position: b.position,
                        sort_order: b.sort_order,
                        description: b.description || '',
                        status: b.status !== undefined ? b.status.toString() : '1'
                    });
                    
                    if (b.image_url) setPreviewImage(b.image_url);
                }
            } catch (error) {
                console.error(error);
                router.push('/admin/banners');
            } finally {
                setLoading(false);
            }
        };
        fetchBanner();
    }, [id, reset, router]); // Dependency array updated

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
            
            // FIX 3: Ensure status is valid
            const statusValue = data.status !== undefined && data.status !== null ? data.status : '1';
            formData.append('status', statusValue);

            if (data.image && data.image[0]) {
                formData.append('image', data.image[0]);
            }

            await bannerService.update(Number(id), formData);
            alert("Cập nhật thành công!");
            router.push('/admin/banners');
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div>Đang tải...</div>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/banners" className="p-2 bg-white border rounded hover:bg-gray-50">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Cập nhật Banner #{id}</h1>
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
                                <input {...register('link')} className="w-full border p-2 rounded" />
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
                            
                            {/* FIX 4: Thêm Select chọn Trạng thái để người dùng kiểm soát */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                                <select {...register('status')} className="w-full border p-2 rounded">
                                    <option value="1">Hiển thị</option>
                                    <option value="0">Ẩn</option>
                                </select>
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
                                <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded cursor-pointer text-sm font-bold">Thay đổi ảnh</span>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    {...register('image', { onChange: handleImageChange })} 
                                />
                            </label>
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                        <Save size={20} /> Cập nhật
                    </button>
                </div>
            </form>
        </div>
    );
}

function ImageIcon(props: LucideProps) {
    return <Upload {...props} />
}