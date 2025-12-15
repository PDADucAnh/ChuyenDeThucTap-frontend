import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true, // Thử bật cái này nếu các cách khác không được
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com", /// Cho phép lấy ảnh từ Unsplash
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nemshop.vn", /// Cho phép lấy ảnh từ nemshop.vn
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "theme.hstatic.net", /// Cho phép lấy ảnh từ theme.hstatic.net
        port: "",
        pathname: "/**",
      },

      {
        protocol: "http",
        hostname: "127.0.0.1", // Ảnh từ Laravel Local
        port: "8000",
        pathname: "/storage/**", // Chỉ cho phép ảnh trong folder storage
      },
      // Thêm cấu hình cho localhost (đề phòng)
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      // Nếu sau này bạn dùng thêm ảnh từ domain khác (ví dụ facebook), hãy thêm vào đây
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
