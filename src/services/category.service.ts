import axiosInstance from '@/lib/axios';

export interface Category {
    id: number;
    name: string;
    slug: string;
    image?: string;
    description?: string;
    parent_id: number;
    sort_order: number;
    status: number;
}

export const categoryService = {
    getAll: async () => {
        return await axiosInstance.get<unknown, { status: boolean, categories: Category[] }>('/categories');
    },

    getById: async (id: number) => {
        return await axiosInstance.get<unknown, { status: boolean, category: Category }>(`/categories/${id}`);
    },

    create: async (formData: FormData) => {
        return await axiosInstance.post('/categories', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    update: async (id: number, formData: FormData) => {
        // FIX BUG: Xóa bỏ `?_method=PUT`
        // Vì Backend Route đang là POST (Route::post('categories/{id}')), 
        // nên ta gửi POST thuần để khớp với Backend.
        return await axiosInstance.post(`/categories/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    delete: async (id: number) => {
        return await axiosInstance.delete(`/categories/${id}`);
    }
};