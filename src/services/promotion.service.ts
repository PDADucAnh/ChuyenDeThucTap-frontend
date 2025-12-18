import axiosInstance from "@/lib/axios";

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

// Updated Payload: Added 'sale_id' to support both Create and Update (Upsert)
export interface PromotionBatchPayload {
  name: string;
  date_begin: string;
  date_end: string;
  products: {
    sale_id?: number | null; // <--- Added this to fix the logic
    product_id: number;
    price_sale: number;
  }[];
}

// Payload for updating a single promotion
export interface PromotionUpdatePayload {
  name: string;
  product_id: number;
  price_sale: number;
  date_begin: string;
  date_end: string;
}

export const promotionService = {
  getPromotions: async () => {
    return await axiosInstance.get<
      unknown,
      { status: boolean; data: Promotion[] }
    >("/product-sales");
  },

  // Create Batch
  createPromotion: async (data: PromotionBatchPayload) => {
    return await axiosInstance.post("/product-sales", data);
  },

  // Update Single
  updatePromotion: async (id: number, data: PromotionUpdatePayload) => {
    return await axiosInstance.put(`/product-sales/${id}`, data);
  },

  // FIXED: Replaced 'any' with 'PromotionBatchPayload'
  saveBatchPromotions: async (payload: PromotionBatchPayload) => {
    return await axiosInstance.post("/product-sales/batch", payload);
  },

  // Delete
  deletePromotion: async (id: number) => {
    return await axiosInstance.delete(`/product-sales/${id}`);
  },

  // Import Excel
  importPromotion: async (formData: FormData) => {
    return await axiosInstance.post("/product-sales/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};