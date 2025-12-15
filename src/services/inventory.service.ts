import axiosInstance from '@/lib/axios';

export interface ProductStore {
    id: number;
    product_id: number;
    product_name?: string; 
    product_image?: string;
    price_root: number; 
    qty: number;        
    updated_at: string;
}

export const inventoryService = {
    getInventory: async () => {
        return await axiosInstance.get<unknown, { status: boolean, data: ProductStore[] }>('/product-stores');
    },

    importStock: async (data: { product_id: number, qty: number, price_root: number }) => {
        return await axiosInstance.post('/product-stores/import', data);
    },

    // MỚI: Cập nhật kho
    updateStock: async (id: number, data: { qty: number, price_root: number }) => {
        return await axiosInstance.put(`/product-stores/${id}`, data);
    },

    // MỚI: Xóa kho
    deleteStock: async (id: number) => {
        return await axiosInstance.delete(`/product-stores/${id}`);
    }
};