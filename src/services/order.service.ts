import axiosInstance from '@/lib/axios';

// 1. Định nghĩa kiểu cho tham số tìm kiếm đơn hàng
export interface OrderQueryParams {
    page?: number;
    limit?: number;
    status?: number;
    keyword?: string;
    [key: string]: unknown; // Cho phép thêm các tham số khác nếu cần
}

// 2. Định nghĩa chi tiết đơn hàng (nếu backend trả về chi tiết)
export interface OrderDetail {
    id: number;
    product_id: number;
    product_name?: string; // Nếu backend join và trả về tên sp
    product?: {            // Hoặc trả về object product
        name: string;
        thumbnail: string;
    };
    price: number;
    qty: number;
    amount: number;
}

export interface Order {
    id: number;
    user_id: number;
    name: string; // Tên người nhận
    phone: string;
    address: string;
    email: string;
    note?: string;
    created_at: string;
    status: number; // 1: Mới, 2: Xác nhận, 3: Đang giao, 4: Hoàn thành, 5: Hủy
    total_amount?: number; 
    order_details?: OrderDetail[]; 
}

// Interface phản hồi danh sách (nếu có phân trang)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface OrderListResponse {
    status: boolean;
    orders: {
        data: Order[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

export const orderService = {
    // Lấy danh sách đơn hàng
    getOrders: async (params?: OrderQueryParams) => {
        return await axiosInstance.get<unknown, OrderListResponse>('/orders', { params });
    },

    // Lấy chi tiết đơn hàng
    getOrderById: async (id: number) => {
        return await axiosInstance.get<unknown, { status: boolean; order: Order }>(`/orders/${id}`);
    },

    // Cập nhật trạng thái đơn hàng
    updateStatus: async (id: number, status: number) => {
        return await axiosInstance.put<unknown, { status: boolean; message: string, order: Order }>(`/orders/${id}`, { status });
    },

    // Xóa đơn hàng
    deleteOrder: async (id: number) => {
        return await axiosInstance.delete(`/orders/${id}`);
    }
};