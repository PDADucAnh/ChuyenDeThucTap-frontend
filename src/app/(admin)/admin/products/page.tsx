"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Trash2, Search, Eye, Upload, Loader2 } from "lucide-react";
import { productService, Product } from "@/services/product.service";
import { AxiosError } from "axios";
// FIX 1 & 3: Removed unused 'toast' import to fix module not found and unused var error

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hàm load dữ liệu
  const fetchProducts = async () => {
    try {
      const res = await productService.getProducts({ limit: 100 });
      if (res.status) {
        setProducts(res.products.data);
      }
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      console.error(
        "Lỗi tải sản phẩm:",
        err.response?.data?.message || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Hàm Xóa sản phẩm
  const handleDelete = async (id: number) => {
    if (
      confirm(
        "Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác."
      )
    ) {
      try {
        await productService.deleteProduct(id);
        alert("Đã xóa sản phẩm thành công!");
        fetchProducts();
      } catch (error) {
        const err = error as AxiosError<{ message: string }>;
        alert("Lỗi khi xóa: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      await productService.importProducts(file);
      alert("Nhập dữ liệu thành công!");
      fetchProducts();
    } catch (error) {
      // FIX 2: Replaced 'any' with proper type checking
      console.error("Upload Error Details:", error);
      let errorMessage = "Lỗi khi nhập file";

      if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div>
      {/* Header: Title & Actions */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h1>
        <div className="flex gap-3">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".xlsx, .xls, .csv"
          />

          {/* Import Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Upload size={20} />
            )}
            Nhập Excel
          </button>

          {/* Create Button */}
          <Link
            href="/admin/products/create"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            Thêm mới
          </Link>
        </div>
      </div>
      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            // FIX 4: Removed unused 'e' parameter
            onChange={() => {
              // Logic tìm kiếm client-side đơn giản hoặc gọi API tìm kiếm
            }}
          />
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Hình ảnh</th>
                <th className="px-6 py-4">Tên sản phẩm</th>
                <th className="px-6 py-4">Giá bán</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="w-12 h-16 relative bg-gray-100 rounded overflow-hidden border">
                        <Image
                          src={
                            product.thumbnail_url ||
                            (product.thumbnail &&
                            product.thumbnail.startsWith("http")
                              ? product.thumbnail
                              : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${product.thumbnail}`) ||
                            "https://placehold.co/400x600?text=No+Image"
                          }
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="font-medium text-gray-900 line-clamp-1"
                        title={product.name}
                      >
                        {product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Slug: {product.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(Number(product.price_buy))}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
                          Hiển thị
                        </span>
                        {product.is_new && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            New
                          </span>
                        )}
                        {product.is_sale && (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Sale
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          target="_blank"
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                          title="Xem trên web"
                        >
                          <Eye size={18} />
                        </Link>

                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Sửa"
                        >
                          <Edit size={18} />
                        </Link>

                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Hiển thị {products.length} sản phẩm mới nhất
          </span>
        </div>
      </div>
    </div>
  );
}
