import axiosInstance from "@/lib/axios";

export interface Attribute {
  id: number;
  name: string;
}

export interface ProductAttributeInput {
  attribute_id: number;
  value: string;
}

// Interface trả về từ Backend (khi gọi getProduct)
export interface ProductAttributeResponse {
  id: number;
  attribute_id: number;
  value: string;
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
  is_new: boolean;
  is_sale: boolean;
  category?: { id: number; name: string; slug: string };
  // Update types for relations
  images?: { id: number; image: string }[];
  product_attributes?: ProductAttributeResponse[];
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
  related_products: Product[];
}

// Define specific response for attribute list
interface AttributeListResponse {
  status: boolean;
  attributes: Attribute[];
}

export const productService = {
  // Get list of available attributes (Size, Color, Material...)
  getAttributes: async () => {
    // Explicitly casting the return to the expected type to handle the interceptor's behavior
    return (await axiosInstance.get("/attributes")) as unknown as AttributeListResponse;
  },

  // Create product
  createProduct: async (formData: FormData) => {
    return await axiosInstance.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Hàm 1: Lấy danh sách sản phẩm
  getProducts: async (params?: ProductQueryParams) => {
    return (await axiosInstance.get("/products", {
      params,
    })) as unknown as ProductListResponse;
  },

  // Hàm 2: Lấy chi tiết 1 sản phẩm
  getProductBySlug: async (slug: string) => {
    return (await axiosInstance.get(
      `/products/${slug}`
    )) as unknown as ProductDetailResponse;
  },

  // Hàm 3: Lấy danh sách danh mục
  getCategories: async () => {
    return (await axiosInstance.get(
      "/categories"
    )) as unknown as CategoryListResponse;
  },

  // 5. Xóa sản phẩm
  deleteProduct: async (id: number) => {
    return await axiosInstance.delete(`/products/${id}`);
  },

  // 6. Cập nhật sản phẩm
  updateProduct: async (id: number, formData: FormData) => {
    return await axiosInstance.post(`/products/${id}?_method=PUT`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};