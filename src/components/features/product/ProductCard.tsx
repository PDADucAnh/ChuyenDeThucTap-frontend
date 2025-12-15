import Link from "next/link";
import Image from "next/image";

interface ProductProps {
  data: {
    id: number;
    name: string;
    slug: string;
    price: number;
    original_price: number;
    image: string;
    is_new?: boolean;
    is_sale?: boolean;
  };
}

export default function ProductCard({ data }: ProductProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="group flex flex-col h-full bg-white">
      {/* --- PHẦN HÌNH ẢNH --- */}
      <Link
        href={`/products/${data.slug}`}
        className="block relative h-[400px] w-full overflow-hidden cursor-pointer"
      >
        {/* 1. Hình ảnh chính */}
        <Image
          src={data.image}
          alt={data.name}
          fill
          className="object-cover transition duration-700 ease-in-out group-hover:scale-110"
        />

        {/* 2. Lớp phủ mờ (Overlay) - Chỉ hiện khi hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

        {/* 3. Nút "XEM THÊM" - Xuất hiện ở giữa khi hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
          <span className="bg-transparent border border-white text-white px-20 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition duration-300">
            Xem thêm
          </span>
        </div>
        {/* Badge: Mới / Giảm giá */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {data.is_new && (
            <span className="bg-black text-white text-[10px] uppercase font-bold px-2 py-1">
              New
            </span>
          )}
          {data.is_sale && (
            <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-1">
              Sale
            </span>
          )}
        </div>
      </Link>

      {/* --- PHẦN THÔNG TIN --- */}
      <div className="pt-4 pb-2 flex flex-col flex-grow text-center">
        {/* Tên sản phẩm */}
        <Link href={`/products/${data.slug}`}>
          <h3 className="text-gray-800 font-medium text-sm uppercase truncate hover:text-gray-500 transition cursor-pointer mb-2 px-2">
            {data.name}
          </h3>
        </Link>

        {/* Giá sản phẩm */}
        <div className="justify-center flex items-center gap-3">
          <span className="text-black font-bold text-sm">
            {formatPrice(data.price)}
          </span>
          {data.original_price > data.price && (
            <span className="text-gray-400 text-xs line-through decoration-1">
              {formatPrice(data.original_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
