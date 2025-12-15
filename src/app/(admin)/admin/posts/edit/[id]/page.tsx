'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { postService, PostPayload } from '@/services/post.service';
import { topicService, Topic } from '@/services/topic.service';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AxiosError } from 'axios';

interface PageProps { params: Promise<{ id: string }> }

export default function EditPostPage({ params }: PageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<PostPayload>();

    const [topics, setTopics] = useState<Topic[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const postType = watch('post_type');

    useEffect(() => {
        const fetchData = async () => {
            const [topicRes, postRes] = await Promise.all([
                topicService.getAll(),
                postService.getPost(Number(id))
            ]);

            if (topicRes.status) setTopics(topicRes.topics);
            
            if (postRes.status && postRes.post) {
                const p = postRes.post;
                setValue('title', p.title);
                setValue('content', p.content);
                setValue('description', p.description || '');
                setValue('post_type', p.post_type);
                setValue('status', p.status.toString());
                if (p.topic_id) setValue('topic_id', p.topic_id.toString());
                
                if (p.image_url) setPreviewImage(p.image_url);
            }
        };
        fetchData();
    }, [id, setValue]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPreviewImage(URL.createObjectURL(file));
    };

    const onSubmit = async (data: PostPayload) => {
        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('content', data.content);
            formData.append('description', data.description || '');
            formData.append('post_type', data.post_type);
            formData.append('status', data.status);
            if (data.topic_id) formData.append('topic_id', data.topic_id);

            if (data.image && data.image[0]) {
                formData.append('image', data.image[0]);
            }

            await postService.updatePost(Number(id), formData);
            alert("Cập nhật thành công!");
            router.push('/admin/posts');
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    // ... (Phần render JSX giống hệt trang Create, chỉ khác tiêu đề H1 và value mặc định từ useForm)
    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Link href="/admin/posts" className="p-2 bg-white border rounded hover:bg-gray-50">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Cập nhật bài viết: #{id}</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* COPY NỘI DUNG FORM TỪ TRANG CREATE VÀO ĐÂY */}
                 {/* TRÁI */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Tiêu đề bài viết</label>
                                <input {...register('title', { required: "Nhập tiêu đề" })} className="w-full border p-2 rounded" />
                                {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
                            </div>
                            
                            {/* Ẩn chọn topic nếu là Page */}
                            {postType === 'post' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Chủ đề</label>
                                    <select {...register('topic_id')} className="w-full border p-2 rounded">
                                        <option value="">-- Chọn chủ đề --</option>
                                        {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                                <textarea {...register('description')} rows={3} className="w-full border p-2 rounded"></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Nội dung chi tiết</label>
                                <textarea {...register('content', { required: true })} rows={10} className="w-full border p-2 rounded font-mono text-sm"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PHẢI */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="mb-4">
                            <label className="block text-sm font-bold mb-2">Loại bài viết</label>
                            <select {...register('post_type')} className="w-full border p-2 rounded">
                                <option value="post">Bài viết (Tin tức)</option>
                                <option value="page">Trang đơn (Giới thiệu, Policy...)</option>
                            </select>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {previewImage ? (
                                <div className="relative aspect-video w-full mb-4">
                                    <Image src={previewImage} alt="Preview" fill className="object-cover rounded" />
                                </div>
                            ) : (
                                <div className="py-8 text-gray-400"><Upload className="mx-auto mb-2"/>Chưa có ảnh</div>
                            )}
                            <label className="block">
                                <span className="bg-blue-50 text-blue-600 px-4 py-2 rounded cursor-pointer text-sm font-bold">Chọn hình ảnh</span>
                                <input type="file" accept="image/*" className="hidden" {...register('image', { onChange: handleImageChange })} />
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