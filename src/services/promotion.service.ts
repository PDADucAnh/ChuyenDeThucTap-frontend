import axiosInstance from '@/lib/axios';

export interface Promotion {
    id: number;
    name: string;
    product_id: number;
    product_name?: string; 
    price_sale: number;
    date_begin: string;
    date_end: string;
    status: number;
}

export interface PromotionPayload {
    name: string;
    product_id: number;
    price_sale: number;
    date_begin: string;
    date_end: string;
}

export const promotionService = {
    getPromotions: async () => {
        return await axiosInstance.get<unknown, { status: boolean, data: Promotion[] }>('/product-sales');
    },
    
    createPromotion: async (data: PromotionPayload) => {
        return await axiosInstance.post('/product-sales', data);
    },

    // MỚI: Cập nhật
    updatePromotion: async (id: number, data: PromotionPayload) => {
        return await axiosInstance.put(`/product-sales/${id}`, data);
    },

    // MỚI: Xóa
    deletePromotion: async (id: number) => {
        return await axiosInstance.delete(`/product-sales/${id}`);
    }
};