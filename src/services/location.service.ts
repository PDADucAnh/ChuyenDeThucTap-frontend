import axios from 'axios';

export interface Location {
    id: string;
    name: string;
}

interface ApiResponse {
    error: number;
    error_text: string;
    data: {
        id: string;
        name: string;
        name_en: string;
        full_name: string;
        full_name_en: string;
        latitude: string;
        longitude: string;
    }[];
}

// API endpoint public của Việt Nam
const BASE_API = 'https://esgoo.net/api-tinhthanh';

export const locationService = {
    // 1. Lấy Tỉnh/Thành
    getProvinces: async (): Promise<Location[]> => {
        try {
            const res = await axios.get<ApiResponse>(`${BASE_API}/1/0.htm`);
            if (res.data.error === 0) {
                return res.data.data.map(item => ({ id: item.id, name: item.full_name }));
            }
            return [];
        } catch (error) {
            console.error("Lỗi lấy tỉnh thành:", error);
            return [];
        }
    },

    // 2. Lấy Quận/Huyện theo ID Tỉnh
    getDistricts: async (provinceId: string): Promise<Location[]> => {
        try {
            const res = await axios.get<ApiResponse>(`${BASE_API}/2/${provinceId}.htm`);
            if (res.data.error === 0) {
                return res.data.data.map(item => ({ id: item.id, name: item.full_name }));
            }
            return [];
        } catch (error) {
            console.error("Lỗi lấy quận huyện:", error);
            return [];
        }
    },

    // 3. Lấy Phường/Xã theo ID Quận
    getWards: async (districtId: string): Promise<Location[]> => {
        try {
            const res = await axios.get<ApiResponse>(`${BASE_API}/3/${districtId}.htm`);
            if (res.data.error === 0) {
                return res.data.data.map(item => ({ id: item.id, name: item.full_name }));
            }
            return [];
        } catch (error) {
            console.error("Lỗi lấy phường xã:", error);
            return [];
        }
    }
};