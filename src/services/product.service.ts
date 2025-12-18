import axiosInstance from "@/lib/axios";

// --- INTERFACES ---

export interface Attribute {
  id: number;
  name: string;
}

export interface ProductAttributeInput {
  attribute_id: number;
  value: string;
}

// Fixed: Separate interface for Product Images to avoid 'any'
export interface ProductImage {
  id: number;
  image: string;
  product_id: number;
}

// Fixed: General interface for Product Attributes (DB structure)
export interface ProductAttribute {
  id: number;
  attribute_id: number;
  value: string;
  product_id: number;
  attribute?: {
    id: number;
    name: string;
  };
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  thumbnail: string;
  thumbnail_url?: string;
  price_buy: number;
  sale_price?: number;
  original_price?: number;
  description: string;
  content?: string;
  is_new: boolean | number;
  is_sale: boolean | number;
  status?: number;
  category_id?: number;
  category?: { id: number; name: string; slug: string };

  // Relations
  images?: ProductImage[];
  product_attributes?: ProductAttribute[];
  attributes?: ProductAttribute[]; // Backend might return one or the other
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  is_new?: number | boolean;
  is_sale?: number | boolean;
  category_id?: number;
  keyword?: string;
  sort?: string;
  price_min?: number;
  price_max?: number;
  [key: string]: unknown;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

// --- RESPONSE INTERFACES ---

interface CategoryListResponse {
  status: boolean;
  categories: Category[];
}

interface ProductListResponse {
  status: boolean;
  products: {
    data: Product[];
    current_page: number;
    last_page: number;
    total: number;
  };
}

interface ProductDetailResponse {
  status: boolean;
  product: Product;
  related_products?: Product[];
}

interface AttributeListResponse {
  status: boolean;
  attributes: Attribute[];
}

// --- SERVICE ---

export const productService = {
  // Get available attributes (Size, Color...)
  getAttributes: async () => {
    return (await axiosInstance.get(
      "/attributes"
    )) as unknown as AttributeListResponse;
  },

  // Create product
  createProduct: async (formData: FormData) => {
    return await axiosInstance.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 1. Get List
  getProducts: async (params?: ProductQueryParams) => {
    return (await axiosInstance.get("/products", {
      params,
    })) as unknown as ProductListResponse;
  },

  // 2. Get Detail by Slug (Frontend)
  getProductBySlug: async (slug: string) => {
    return (await axiosInstance.get(
      `/products/${slug}`
    )) as unknown as ProductDetailResponse;
  },

  // 3. Get Detail by ID (Admin Edit - ADDED THIS)
  getProductById: async (id: number) => {
    return (await axiosInstance.get(
      `/products/${id}`
    )) as unknown as ProductDetailResponse;
  },

  // 4. Get Categories
  getCategories: async () => {
    return (await axiosInstance.get(
      "/categories"
    )) as unknown as CategoryListResponse;
  },

  // 5. Delete Product
  deleteProduct: async (id: number) => {
    return await axiosInstance.delete(`/products/${id}`);
  },

  // 6. Update Product
  updateProduct: async (id: number, formData: FormData) => {
    // Note: FormData updates usually require POST method in Laravel
    return await axiosInstance.post(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // 7. Import Excel
  importProducts: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return await axiosInstance.post("/products/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  // 8. Toggle Status
  toggleStatus: async (id: number) => {
    return await axiosInstance.patch(`/products/${id}/toggle-status`);
  },
};
