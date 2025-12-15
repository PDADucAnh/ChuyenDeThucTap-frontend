import axiosInstance from '@/lib/axios';

export interface Topic {
    id: number;
    name: string;
    slug: string;
    sort_order?: number;
    description?: string;
    status?: number;
}

export const topicService = {
    getAll: async () => {
        return await axiosInstance.get<unknown, { status: boolean, topics: Topic[] }>('/topics');
    },
    // (Có thể thêm create, update, delete cho Topic nếu cần quản lý cả chủ đề)
};