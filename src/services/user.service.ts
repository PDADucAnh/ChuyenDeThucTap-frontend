import axiosInstance from '@/lib/axios';

export interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    roles: 'admin' | 'customer';
    created_at: string;
    // ... các trường khác
}

export interface UserPayload {
    name: string;
    email: string;
    phone: string;
    password?: string;
    roles: 'admin' | 'customer';
    address?: string;
}

export const userService = {
    getUsers: async (params?: Record<string, unknown>) => {
        return await axiosInstance.get<unknown, { status: boolean, data: { data: User[], total: number } }>('/users', { params });
    },

    createUser: async (data: UserPayload) => {
        return await axiosInstance.post('/users', data);
    },

    updateUser: async (id: number, data: Partial<UserPayload>) => {
        return await axiosInstance.put(`/users/${id}`, data);
    },

    deleteUser: async (id: number) => {
        return await axiosInstance.delete(`/users/${id}`);
    }
};