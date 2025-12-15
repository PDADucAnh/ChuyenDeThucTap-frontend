import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Kiểu dữ liệu của 1 sản phẩm trong giỏ
export interface CartItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number, size: string, color: string) => void;
  updateQuantity: (id: number, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => set((state) => {
        // Kiểm tra xem sản phẩm đã có trong giỏ chưa (trùng ID, Size, Màu)
        const existingItem = state.items.find(
            item => item.id === newItem.id && item.size === newItem.size && item.color === newItem.color
        );

        if (existingItem) {
            // Nếu có rồi thì tăng số lượng
            return {
                items: state.items.map(item => 
                    (item.id === newItem.id && item.size === newItem.size && item.color === newItem.color)
                    ? { ...item, quantity: item.quantity + newItem.quantity }
                    : item
                )
            };
        }
        // Nếu chưa thì thêm mới
        return { items: [...state.items, newItem] };
      }),

      removeItem: (id, size, color) => set((state) => ({
        items: state.items.filter(item => !(item.id === id && item.size === size && item.color === color))
      })),

      updateQuantity: (id, size, color, quantity) => set((state) => ({
        items: state.items.map(item => 
            (item.id === id && item.size === size && item.color === color)
            ? { ...item, quantity: Math.max(1, quantity) } // Không cho nhỏ hơn 1
            : item
        )
      })),

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => {
          return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'cart-storage', // Tên key lưu trong localStorage
    }
  )
);