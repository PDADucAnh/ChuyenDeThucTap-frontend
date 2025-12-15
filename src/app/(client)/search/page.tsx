"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react"; // Suspense cần thiết cho useSearchParams
import { MOCK_PRODUCTS } from "@/mocks/products";
import ProductCard from "@/components/features/product/ProductCard";
import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import Link from "next/link";

// Component con để xử lý logic search (Tránh lỗi Suspense boundary của Next.js)
function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; // Lấy từ khóa từ URL

  // Logic lọc sản phẩm (Tìm theo tên, không phân biệt hoa thường)
  const filteredProducts = MOCK_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  // TRƯỜNG HỢP 1: KHÔNG CÓ KẾT QUẢ (Giống ảnh 4)
  if (query && filteredProducts.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="container mx-auto px-4">
          <p className="text-xl md:text-2xl text-gray-700 mb-20 font-light">
            Không tìm thấy kết quả tìm kiếm phù hợp cho:{" "}
            <span className="font-bold">{query}</span>
          </p>
        </div>
      </div>
    );
  }

  // TRƯỜNG HỢP 2: CÓ KẾT QUẢ (Giống ảnh 3)
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <span className="text-sm text-gray-500 uppercase tracking-wide">
          Trang chủ / Tìm kiếm
        </span>
        <h1 className="text-3xl font-light mt-4">
          Kết quả tìm kiếm: <span className="font-normal">{query}</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} data={product} />
        ))}
      </div>
    </div>
  );
}

// Main Page Component
export default function SearchPage() {
  return (
    // Bọc trong Suspense để tránh lỗi khi build Next.js
    <Suspense
      fallback={<div className="text-center py-20">Đang tìm kiếm...</div>}
    >
      <SearchContent />
    </Suspense>
  );
}
