import axiosInstance from '@/lib/axios';

export interface Banner {
    id: number;
    name: string;
    image: string;
    image_url?: string;
    link?: string;
    position: 'slideshow' | 'ads';
    sort_order: number;
    description?: string;
    status: number;
    created_at: string;
}

export interface BannerPayload {
    name: string;
    link?: string;
    position: string;
    sort_order?: number;
    description?: string;
    status: string;
    image?: FileList;
}

export const bannerService = {
    // FIX: Replace 'params?: any' with 'params?: Record<string, unknown>'
    getAll: async (params?: Record<string, unknown>) => {
        return await axiosInstance.get<unknown, { status: boolean, banners: Banner[] }>('/banners', { params });
    },

    getById: async (id: number) => {
        return await axiosInstance.get<unknown, { status: boolean, banner: Banner }>(`/banners/${id}`);
    },

    create: async (formData: FormData) => {
        return await axiosInstance.post('/banners', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // FIX BUG: Removed ?_method=PUT because the backend route is defined as POST.
    update: async (id: number, formData: FormData) => {
        return await axiosInstance.post(`/banners/${id}`, formData, {
             headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    delete: async (id: number) => {
        return await axiosInstance.delete(`/banners/${id}`);
    }
};