// import axiosInstance from '@/lib/axios';
// import Cookies from 'js-cookie';

// // Định nghĩa kiểu dữ liệu User và Login Response
// export interface User {
//     id: number;
//     name: string;
//     email: string;
//     phone?: string;
//     address?: string;
//     roles?: string;
// }

// interface AuthResponse {
//     access_token: string;
//     token_type: string;
//     expires_in: number;
//     user: User;
// }

// export const authService = {
//     // 1. Đăng ký
//     register: async (payload: any) => {
//         return await axiosInstance.post('/auth/register', payload);
//     },

//     // 2. Đăng nhập
//     login: async (payload: any) => {
//         const res = await axiosInstance.post<any, AuthResponse>('/auth/login', payload);
//         // Nếu login thành công, lưu token vào Cookie
//         if (res.access_token) {
//             Cookies.set('access_token', res.access_token, { expires: 7 }); // Lưu 7 ngày
//             Cookies.set('user_info', JSON.stringify(res.user), { expires: 7 });
//         }
//         return res;
//     },

//     // 3. Lấy thông tin User hiện tại (Profile)
//     getProfile: async () => {
//         return await axiosInstance.get<any, User>('/auth/profile');
//     },

//     // 4. Đăng xuất
//     logout: async () => {
//         try {
//             await axiosInstance.post('/auth/logout');
//         } catch (error) {
//             console.error(error);
//         } finally {
//             // Xóa hết cookie dù API có lỗi hay không
//             Cookies.remove('access_token');
//             Cookies.remove('user_info');
//             window.location.href = '/login';
//         }
//     }
// };
//==============================================================================
import axiosInstance from '@/lib/axios';
import Cookies from 'js-cookie';

// 1. Định nghĩa kiểu dữ liệu User
export interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    roles?: string;
}

// 2. Định nghĩa kiểu phản hồi khi Login thành công
interface AuthResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: User;
}

// 3. Định nghĩa kiểu dữ liệu gửi lên (Payload) để thay thế 'any'
export interface RegisterPayload {
    name: string;
    email: string;
    phone: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export const authService = {
    // SỬA LỖI: Thay 'payload: any' bằng 'payload: RegisterPayload'
    register: async (payload: RegisterPayload) => {
        return await axiosInstance.post('/auth/register', payload);
    },

    // SỬA LỖI: Thay 'payload: any' bằng 'payload: LoginPayload'
    login: async (payload: LoginPayload) => {
        // axiosInstance.post<Kiểu_Gửi, Kiểu_Nhận>
        const res = await axiosInstance.post<unknown, AuthResponse>('/auth/login', payload);
        
        // Nếu login thành công, lưu token vào Cookie
        if (res.access_token) {
            Cookies.set('access_token', res.access_token, { expires: 7 }); // Lưu 7 ngày
            Cookies.set('user_info', JSON.stringify(res.user), { expires: 7 });
        }
        return res;
    },

    // 3. Lấy thông tin User hiện tại (Profile)
    getProfile: async () => {
        return await axiosInstance.get<unknown, User>('/auth/profile');
    },

    // 4. Đăng xuất
    logout: async () => {
        try {
            await axiosInstance.post('/auth/logout');
        } catch (error) {
            console.error(error);
        } finally {
            // Xóa hết cookie dù API có lỗi hay không
            Cookies.remove('access_token');
            Cookies.remove('user_info');
            window.location.href = '/login';
        }
    }
};