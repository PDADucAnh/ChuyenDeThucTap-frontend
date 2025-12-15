"use client"; // Chuyển sang Client Component để dùng useEffect

import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/features/product/ProductCard";
import { productService, Product } from "@/services/product.service";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API khi trang vừa load
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Gọi API lấy sản phẩm mới (truyền tham số is_new=1)
        const res = await productService.getProducts({ is_new: 1, limit: 8 });
        if (res.status) {
          setNewProducts(res.products.data);
        }
      } catch (error) {
        // Ép kiểu error về AxiosError để TypeScript hiểu cấu trúc
        const err = error as AxiosError;
        console.error(
          "Lỗi tải sản phẩm:",
          err.response ? err.response.data : err.message
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-white">
      {/* HERO BANNER (Giữ nguyên hoặc gọi API Banner nếu muốn) */}
      <section className="relative w-full h-[600px] md:h-[700px]">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
          alt="PDA Collection"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute bottom-20 left-0 right-0 text-center text-white p-4">
          <h2 className="text-5xl md:text-7xl font-thin uppercase tracking-widest mb-6">
            New Collection
          </h2>
          <Link
            href="/products"
            className="inline-block bg-white text-black px-10 py-3 font-medium text-sm uppercase tracking-wider hover:bg-black hover:text-white transition duration-300"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* SECTION: SẢN PHẨM MỚI (DỮ LIỆU THẬT) */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light uppercase tracking-[0.2em] mb-2">
            Sản phẩm mới
          </h2>
          <p className="text-gray-500 text-sm">
            Các thiết kế mới nhất từ PDA Fashion
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {newProducts.map((product) => {
              // LOGIC KIỂM TRA GIÁ KHUYẾN MÃI
              // Nếu có sale_price (từ backend) -> Dùng nó làm giá chính, giá gốc đẩy xuống original
              const hasSale =
                product.sale_price !== null && product.sale_price !== undefined;
              const currentPrice = hasSale
                ? Number(product.sale_price)
                : Number(product.price_buy);
              const oldPrice = hasSale ? Number(product.price_buy) : 0;

              return (
                <ProductCard
                  key={product.id}
                  data={{
                    id: product.id,
                    name: product.name,
                    slug: product.slug,
                    // Cập nhật logic giá tại đây:
                    price: currentPrice,
                    original_price: oldPrice,
                    is_sale: hasSale, // Bật cờ Sale nếu có giá giảm
                    is_new: Boolean(product.is_new), // Đảm bảo kiểu boolean

                    // Ưu tiên dùng thumbnail_url từ backend nếu có
                    image:
                      product.thumbnail_url ||
                      (product.thumbnail.startsWith("http")
                        ? product.thumbnail
                        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${product.thumbnail}`),
                  }}
                />
              );
            })}{" "}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/products"
            className="inline-block border border-black px-12 py-3 text-sm font-medium uppercase hover:bg-black hover:text-white transition"
          >
            Xem tất cả
          </Link>
        </div>
      </section>
    </div>
  );
}
