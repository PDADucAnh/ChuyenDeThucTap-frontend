import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Tạo instance axios
const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL, // Đọc từ .env
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000,
});

// 1. Request Interceptor (Gửi kèm Token nếu có)
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Nếu bạn lưu token ở cookie hoặc localStorage, lấy ra ở đây
        // const token = Cookies.get('access_token');
        // if (token && config.headers) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Response Interceptor (Xử lý dữ liệu trả về)
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        // Trả về data trực tiếp để đỡ phải gọi .data nhiều lần
        return response.data;
    },
    async (error: AxiosError) => {
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosInstance;