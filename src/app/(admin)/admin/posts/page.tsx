'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, FileText } from 'lucide-react';
import { postService, Post } from '@/services/post.service';
import { AxiosError } from 'axios';

export default function PostsPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await postService.getPosts({ limit: 20 });
            if (res.status) {
                setPosts(res.posts.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchPosts(), 0);
        return () => clearTimeout(timer);
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;
        try {
            await postService.deletePost(id);
            alert("Đã xóa bài viết!");
            fetchPosts();
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý bài viết</h1>
                <Link 
                    href="/admin/posts/create" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Viết bài mới
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                            <th className="px-6 py-4">Hình ảnh</th>
                            <th className="px-6 py-4">Tiêu đề</th>
                            <th className="px-6 py-4">Chủ đề</th>
                            <th className="px-6 py-4">Loại</th>
                            <th className="px-6 py-4">Ngày đăng</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8">Đang tải...</td></tr>
                        ) : posts.map((post) => (
                            <tr key={post.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="w-16 h-12 relative bg-gray-100 rounded overflow-hidden border">
                                        {post.image_url ? (
                                            <Image src={post.image_url} alt="" fill className="object-cover"/>
                                        ) : <div className="flex items-center justify-center h-full text-gray-400"><FileText size={20}/></div>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 line-clamp-2 max-w-xs" title={post.title}>
                                    {post.title}
                                </td>
                                <td className="px-6 py-4 text-blue-600">
                                    {post.topic?.name || '---'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${post.post_type === 'page' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                        {post.post_type === 'page' ? 'Trang đơn' : 'Bài viết'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <Link href={`/admin/posts/edit/${post.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                        <Edit size={18}/>
                                    </Link>
                                    <button onClick={() => handleDelete(post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}