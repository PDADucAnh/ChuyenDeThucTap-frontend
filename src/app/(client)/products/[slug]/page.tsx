"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
// FIX: Removed 'AxiosError' from lucide-react import
import {
  ShoppingBag,
  Heart,
  Ruler,
  ChevronDown,
  ChevronUp,
  Star,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { productService, Product } from "@/services/product.service";
import { useCartStore } from "@/store/useCartStore";
// FIX: Ensure AxiosError is imported from axios
import { AxiosError } from "axios";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: Props) {
  const { slug } = use(params);
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await productService.getProductBySlug(slug);
        if (res.status) {
          setProduct(res.product);
        } else {
          notFound();
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [slug]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Đang tải...
      </div>
    );
  if (!product)
    return <div className="text-center py-20">Không tìm thấy sản phẩm</div>;

  const productImages = [
    product.thumbnail,
    ...(product.images?.map((img) => img.image) || []),
  ].map((img) =>
    img && img.startsWith("http")
      ? img
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${img}`
  );

  // --- LOGIC TÍNH GIÁ KHUYẾN MÃI ---
  const hasSale =
    product.sale_price !== null && product.sale_price !== undefined;
  const currentPrice = hasSale
    ? Number(product.sale_price)
    : Number(product.price_buy);
  const oldPrice = hasSale ? Number(product.price_buy) : 0;
  const discountPercent =
    hasSale && oldPrice > 0
      ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
      : 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(price));

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: currentPrice, // Thêm vào giỏ với giá hiện tại (giá giảm nếu có)
      image: productImages[0],
      size: "M",
      color: "Black",
      quantity: quantity,
    });
    alert("Đã thêm vào giỏ hàng!");
  };

  return (
    <div className="bg-white pb-10">
      <div className="container mx-auto px-4 py-4 text-xs md:text-sm text-gray-500 flex gap-2">
        <Link href="/">Trang chủ</Link> / <Link href="/products">Sản phẩm</Link>{" "}
        /{" "}
        <span className="text-black font-medium truncate">{product.name}</span>
      </div>

      <div className="container mx-auto px-4 mt-4">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* --- LEFT: HÌNH ẢNH --- */}
          <div className="w-full lg:w-[60%] flex gap-4">
            <div className="hidden lg:flex flex-col gap-4 w-[100px] flex-shrink-0">
              {productImages.map((img, index) => (
                <div
                  key={index}
                  className={`relative w-full aspect-[3/4] cursor-pointer border-2 transition ${
                    selectedImage === index
                      ? "border-black"
                      : "border-transparent"
                  }`}
                  onClick={() => setSelectedImage(index)}
                  onMouseEnter={() => setSelectedImage(index)}
                >
                  <Image src={img} alt="thumb" fill className="object-cover" />
                </div>
              ))}
            </div>
            <div className="flex-1 relative aspect-[3/4] bg-gray-50 overflow-hidden">
              <Image
                src={productImages[selectedImage]}
                alt={product.name}
                fill
                className="object-cover animate-fadeIn"
                priority
              />
            </div>
          </div>

          {/* --- RIGHT: THÔNG TIN --- */}
          <div className="w-full lg:w-[40%]">
            <div className="sticky top-24">
              <h1 className="text-2xl md:text-3xl font-medium uppercase tracking-wide mb-2 text-gray-900">
                {product.name}
              </h1>

              {/* HIỂN THỊ GIÁ CÓ KHUYẾN MÃI */}
              <div className="flex items-end gap-3 mb-6 border-b pb-6 border-gray-100">
                <span className="text-2xl font-bold text-red-600">
                  {formatPrice(currentPrice)}
                </span>
                {hasSale && (
                  <>
                    <span className="text-lg text-gray-400 line-through mb-1">
                      {formatPrice(oldPrice)}
                    </span>
                    <span className="text-xs font-bold text-white bg-red-600 px-2 py-1 rounded mb-2">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <div className="flex gap-4 mb-8">
                <div className="flex items-center border border-gray-300 h-12 w-32">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-full flex items-center justify-center"
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    readOnly
                    className="w-full h-full text-center outline-none font-bold"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-full flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-black text-white h-12 font-bold uppercase tracking-wider hover:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} /> Thêm vào giỏ
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold mb-2 uppercase text-sm">
                  Mô tả sản phẩm
                </h3>
                <div
                  className="text-sm text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: product.description || product.content || "",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
