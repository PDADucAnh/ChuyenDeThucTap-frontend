import axiosInstance from '@/lib/axios';

export interface Menu {
    id: number;
    name: string;
    link: string;
    type: 'category' | 'topic' | 'page' | 'custom';
    parent_id: number;
    table_id?: number;
    sort_order: number;
    position: 'mainmenu' | 'footermenu';
    status: number;
}

// 1. Define interface for query params
export interface MenuQueryParams {
    position?: string;
    type?: string;
    status?: number;
    [key: string]: unknown;
}

// 2. Define interface for Menu payload (create/update)
export interface MenuPayload {
    name: string;
    link: string;
    type: string;
    parent_id?: number;
    table_id?: number;
    sort_order?: number;
    position: string;
    status: number;
    [key: string]: unknown;
}

export const menuService = {
    // FIX: Replace 'any' with 'MenuQueryParams'
    getMenus: async (params?: MenuQueryParams) => {
        return await axiosInstance.get<unknown, { status: boolean, menus: Menu[] }>('/menus', { params });
    },
    
    getMenu: async (id: number) => {
        return await axiosInstance.get<unknown, { status: boolean, menu: Menu }>(`/menus/${id}`);
    },

    // FIX: Replace 'any' with 'MenuPayload'
    createMenu: async (data: MenuPayload) => {
        return await axiosInstance.post('/menus', data);
    },

    // FIX: Replace 'any' with 'MenuPayload'
    updateMenu: async (id: number, data: MenuPayload) => {
        return await axiosInstance.put(`/menus/${id}`, data);
    },

    deleteMenu: async (id: number) => {
        return await axiosInstance.delete(`/menus/${id}`);
    }
};