// 'use client';

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { useRouter } from "next/navigation"; // Hook để chuyển trang
// import { Search, ShoppingBag, User, Menu, X } from "lucide-react";
// import { useCartStore } from "@/store/useCartStore";

// export default function Header() {
//   const items = useCartStore((state) => state.items);
//   const router = useRouter();

//   // State quản lý việc đóng mở ô tìm kiếm
//   const [isSearchOpen, setIsSearchOpen] = useState(false);
//   const [keyword, setKeyword] = useState("");
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => setMounted(true), []);

//   // Hàm xử lý tìm kiếm
//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault(); // Chặn reload trang
//     if (keyword.trim()) {
//       // Chuyển hướng sang trang search với tham số query
//       router.push(`/search?q=${encodeURIComponent(keyword)}`);
//       setIsSearchOpen(false); // Đóng ô tìm kiếm sau khi submit
//     }
//   };

//   return (
//     <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100 font-sans">
//       <div className="container mx-auto px-4 h-20 flex items-center justify-between relative">

//         {/* 1. Mobile Menu */}
//         <button className="lg:hidden p-2 text-gray-600">
//           <Menu size={24} />
//         </button>

//         {/* 2. Logo */}
//         <Link href="/" className="flex-shrink-0">
//           <div className="relative w-32 h-12">
//             <Image
//               src="/logo.png" // Đảm bảo bạn có file logo này
//               alt="PDA Fashion"
//               fill
//               className="object-contain"
//               priority
//             />
//           </div>
//         </Link>

//         {/* 3. Navigation */}
//         <nav className="hidden lg:flex items-center gap-8 font-medium text-sm uppercase tracking-wide text-gray-700">
//           <Link href="/products" className="hover:text-black transition">Sản phẩm</Link>
//           <Link href="/products?category=new" className="hover:text-black transition">Sản phẩm mới</Link>
//           <Link href="/products?category=sale" className="text-red-600 hover:text-red-700 transition">Sale Online</Link>
//           <Link href="/about" className="hover:text-black transition">Bộ sưu tập</Link>
//         </nav>

//         {/* 4. Icons & Search Form */}
//         <div className="flex items-center gap-4 text-gray-700">

//           {/* --- SEARCH BOX AREA --- */}
//           <div className="relative">
//              {/* Nút kính lúp để mở form */}
//              <button
//                 onClick={() => setIsSearchOpen(!isSearchOpen)}
//                 className="hover:text-black p-1 transition"
//              >
//                 {isSearchOpen ? <X size={22} /> : <Search size={22} strokeWidth={1.5} />}
//              </button>

//              {/* Dropdown Form (Giống ảnh 1 & 2) */}
//              {isSearchOpen && (
//                 <div className="absolute top-full right-0 mt-4 w-[300px] bg-white shadow-lg border border-gray-100 p-3 animate-fadeIn z-50 rounded-sm">
//                    {/* Mũi tên trỏ lên (Trang trí) */}
//                    <div className="absolute -top-2 right-2 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45"></div>

//                    <form onSubmit={handleSearch} className="relative flex">
//                       <input
//                         type="text"
//                         placeholder="Tìm kiếm..."
//                         value={keyword}
//                         onChange={(e) => setKeyword(e.target.value)}
//                         autoFocus
//                         className="w-full border border-gray-300 pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-black transition"
//                       />
//                       <button
//                         type="submit"
//                         className="absolute right-0 top-0 h-full w-10 bg-black text-white flex items-center justify-center hover:bg-gray-800 transition"
//                       >
//                          <Search size={16} />
//                       </button>
//                    </form>
//                 </div>
//              )}
//           </div>

//           <Link href="/login" className="hover:text-black p-1">
//             <User size={22} strokeWidth={1.5} />
//           </Link>

//           <Link href="/cart" className="hover:text-black p-1 relative">
//             <ShoppingBag size={22} strokeWidth={1.5} />
//             {mounted && items.length > 0 && (
//               <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
//                 {items.length}
//               </span>
//             )}
//           </Link>
//         </div>
//       </div>
//     </header>
//   );
// }
//==============================================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  User as UserIcon,
  Menu,
  X,
  LogOut,
  FileText,
  Heart,
  User,
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore"; // Import Auth Store
import { authService } from "@/services/auth.service"; // Import Service để gọi logout API

export default function Header() {
  const items = useCartStore((state) => state.items);
  const { user, logout } = useAuthStore(); // Lấy user và hàm logout
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [mounted, setMounted] = useState(false);

  // FIX: Sử dụng setTimeout để tránh lỗi set-state-in-effect
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword)}`);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout(); // Gọi API logout (xóa cookie)
    logout(); // Xóa state trong store
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100 font-sans">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between relative">
        {/* 1. Mobile Menu */}
        <button className="lg:hidden p-2 text-gray-600">
          <Menu size={24} />
        </button>

        {/* 2. Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="relative w-32 h-12">
            <Image
              src="/logo.png"
              alt="PDA Fashion"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* 3. Navigation */}
        <nav className="hidden lg:flex items-center gap-8 font-medium text-sm uppercase tracking-wide text-gray-700">
          <Link href="/products" className="hover:text-black transition">
            Sản phẩm
          </Link>
          <Link
            href="/products?category=new"
            className="hover:text-black transition"
          >
            Sản phẩm mới
          </Link>
          <Link
            href="/products?category=sale"
            className="text-red-600 hover:text-red-700 transition"
          >
            Sale Online
          </Link>
          <Link href="/about" className="hover:text-black transition">
            Bộ sưu tập
          </Link>
        </nav>

        {/* 4. Icons & User Menu */}
        <div className="flex items-center gap-4 text-gray-700">
          {/* --- SEARCH BOX --- */}
          <div className="relative">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hover:text-black p-1 transition"
            >
              {isSearchOpen ? (
                <X size={22} />
              ) : (
                <Search size={22} strokeWidth={1.5} />
              )}
            </button>

            {isSearchOpen && (
              <div className="absolute top-full right-0 mt-4 w-[300px] bg-white shadow-lg border border-gray-100 p-3 animate-fadeIn z-50 rounded-sm">
                <div className="absolute -top-2 right-2 w-4 h-4 bg-white border-t border-l border-gray-100 transform rotate-45"></div>
                <form onSubmit={handleSearch} className="relative flex">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    autoFocus
                    className="w-full border border-gray-300 pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-black transition"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 h-full w-10 bg-black text-white flex items-center justify-center hover:bg-gray-800 transition"
                  >
                    <Search size={16} />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* --- USER MENU (LOGIC MỚI) --- */}
          {mounted && user ? (
            // TRƯỜNG HỢP ĐÃ ĐĂNG NHẬP: Hiện Tên + Dropdown
            <div className="relative group z-40">
              <Link
                href="/profile"
                className="flex items-center gap-2 hover:text-black cursor-pointer py-2"
              >
                <UserIcon size={22} strokeWidth={1.5} />
                <span className="text-sm font-medium hidden md:block max-w-[150px] truncate">
                  {user.name}
                </span>
              </Link>

              {/* Dropdown Menu (Hiện khi hover vào group cha) */}
              <div className="absolute right-0 top-full pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                <div className="bg-white shadow-lg border border-gray-100 rounded-sm overflow-hidden">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition border-b border-gray-50"
                  >
                    <User size={16} /> Thông tin tài khoản
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition border-b border-gray-50"
                  >
                    <FileText size={16} /> Lịch sử đơn hàng
                  </Link>
                  <Link
                    href="/wishlist"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition border-b border-gray-50"
                  >
                    <Heart size={16} /> Danh sách yêu thích
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition text-left"
                  >
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // TRƯỜNG HỢP CHƯA ĐĂNG NHẬP
            <Link href="/login" className="hover:text-black p-1">
              <UserIcon size={22} strokeWidth={1.5} />
            </Link>
          )}

          {/* Cart Icon */}
          <Link href="/cart" className="hover:text-black p-1 relative">
            <ShoppingBag size={22} strokeWidth={1.5} />
            {mounted && items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                {items.length}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
