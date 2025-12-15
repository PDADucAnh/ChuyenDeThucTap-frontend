import axiosInstance from '@/lib/axios';

export interface Post {
    id: number;
    title: string;
    slug: string;
    image?: string;
    image_url?: string;
    content: string;
    description?: string;
    topic_id?: number;
    topic?: { id: number, name: string };
    post_type: 'post' | 'page';
    status: number;
    created_at: string;
}

export interface PostPayload {
    title: string;
    topic_id?: string; // Form select value is string
    content: string;
    description?: string;
    post_type: string;
    status: string;
    image?: FileList;
}

export const postService = {
    // FIX: Replace 'params?: any' with a more specific type like 'Record<string, unknown>'
    getPosts: async (params?: Record<string, unknown>) => {
        return await axiosInstance.get<unknown, { status: boolean, posts: { data: Post[], total: number, last_page: number } }>('/posts', { params });
    },

    getPost: async (id: number) => {
        return await axiosInstance.get<unknown, { status: boolean, post: Post }>(`/posts/${id}`);
    },

    createPost: async (formData: FormData) => {
        return await axiosInstance.post('/posts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    updatePost: async (id: number, formData: FormData) => {
        // FIX BUG: Xóa bỏ `?_method=PUT`
        // Backend đang dùng Route::post('posts/{id}'), nên ta gửi POST thuần.
        return await axiosInstance.post(`/posts/${id}`, formData, {
             headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    deletePost: async (id: number) => {
        return await axiosInstance.delete(`/posts/${id}`);
    },
    
    // Hàm này đã có từ trước cho phần Menu
    getPages: async () => {
        return await axiosInstance.get<unknown, { status: boolean, posts: Post[] }>('/posts?type=page');
    }
};