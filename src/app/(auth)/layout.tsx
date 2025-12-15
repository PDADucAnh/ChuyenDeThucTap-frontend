import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Định nghĩa kiểu dữ liệu cho props
interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Readonly<AuthLayoutProps>) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header dùng chung */}
      <Header />
      
      {/* Phần thân: Căn giữa nội dung (Form Login/Register sẽ hiển thị ở đây) */}
      <main className="flex-grow flex items-center justify-center py-16 bg-white">
        {children}
      </main>

      {/* Footer dùng chung */}
      <Footer />
    </div>
  );
}