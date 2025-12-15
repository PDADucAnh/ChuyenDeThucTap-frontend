'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Filter, Loader2 } from 'lucide-react';
import ProductCard from '@/components/features/product/ProductCard';
import { productService, Product, Category } from '@/services/product.service';

const PRICE_RANGES = [
    { id: 'all', label: 'Tất cả', min: 0, max: 999999999 },
    { id: 'under_500', label: 'Dưới 500.000đ', min: 0, max: 500000 },
    { id: '500_1000', label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
    { id: '1000_2000', label: '1.000.000đ - 2.000.000đ', min: 1000000, max: 2000000 },
    { id: 'above_2000', label: 'Trên 2.000.000đ', min: 2000000, max: 999999999 },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [filterPriceId, setFilterPriceId] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
        try {
            const res = await productService.getCategories();
            if (res.status) {
                setCategories(res.categories);
            }
        } catch (error) {
            console.error("Lỗi tải danh mục:", error);
        }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const priceRange = PRICE_RANGES.find(r => r.id === filterPriceId);
            const res = await productService.getProducts({
                category_id: selectedCategoryId || undefined,
                sort: sortOrder,
                price_min: priceRange?.min, 
                price_max: priceRange?.max,
            });

            if (res.status) {
                setProducts(res.products.data);
                setTotalProducts(res.products.total);
            }
        } catch (error) {
            console.error("Lỗi tải sản phẩm:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchProducts();
  }, [selectedCategoryId, filterPriceId, sortOrder]);

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
             <div className="text-xs text-gray-500 mb-2">
                <Link href="/">Trang chủ</Link> / <span className="text-black font-bold">Danh mục sản phẩm</span>
             </div>
             <h1 className="text-3xl font-medium uppercase tracking-widest">Tất cả sản phẩm</h1>
        </div>

        <div className="lg:hidden flex justify-between items-center mb-6 border-y py-3 sticky top-16 bg-white z-40">
            <button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)} className="flex items-center gap-2 text-sm font-bold uppercase">
                <Filter size={18}/> Bộ lọc
            </button>
            <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="text-sm border-none focus:ring-0 font-medium"
            >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá tăng dần</option>
                <option value="price_desc">Giá giảm dần</option>
            </select>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            <aside className={`lg:w-1/4 lg:block ${isMobileFilterOpen ? 'block' : 'hidden'}`}>
                <div className="sticky top-24 space-y-8">
                    <div>
                        <h3 className="font-bold text-sm uppercase mb-4 border-b pb-2">Danh mục</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <button 
                                    onClick={() => setSelectedCategoryId(null)}
                                    className={`hover:text-black hover:font-bold transition ${selectedCategoryId === null ? 'text-black font-bold underline' : ''}`}
                                >
                                    Tất cả
                                </button>
                            </li>
                            {categories.map((cat) => (
                                <li key={cat.id}>
                                    <button 
                                        onClick={() => setSelectedCategoryId(cat.id)}
                                        className={`hover:text-black hover:font-bold transition ${selectedCategoryId === cat.id ? 'text-black font-bold underline' : ''}`}
                                    >
                                        {cat.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-sm uppercase mb-4 border-b pb-2">Khoảng giá</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            {PRICE_RANGES.map((range) => (
                                <li key={range.id} className="flex items-center gap-2">
                                    <input 
                                        type="radio" 
                                        name="price" 
                                        id={range.id}
                                        checked={filterPriceId === range.id}
                                        onChange={() => setFilterPriceId(range.id)}
                                        className="accent-black cursor-pointer"
                                    />
                                    <label htmlFor={range.id} className="cursor-pointer hover:text-black">{range.label}</label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </aside>

            <main className="lg:w-3/4">
                <div className="hidden lg:flex justify-between items-center mb-6">
                    <span className="text-sm text-gray-500">Hiển thị {products.length} / {totalProducts} sản phẩm</span>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">Sắp xếp:</span>
                        <div className="relative">
                            <select 
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:border-black cursor-pointer bg-white"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="price_asc">Giá: Thấp đến Cao</option>
                                <option value="price_desc">Giá: Cao đến Thấp</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-gray-400" size={40} />
                    </div>
                ) : (
                    <>
                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {products.map((product) => {
                                    // --- LOGIC GIÁ KHUYẾN MÃI ---
                                    const hasSale = product.sale_price !== null && product.sale_price !== undefined;
                                    const currentPrice = hasSale ? Number(product.sale_price) : Number(product.price_buy);
                                    const oldPrice = hasSale ? Number(product.price_buy) : 0;

                                    return (
                                        <ProductCard 
                                            key={product.id} 
                                            data={{
                                                id: product.id,
                                                name: product.name,
                                                slug: product.slug,
                                                // Sử dụng giá đã tính toán
                                                price: currentPrice,
                                                original_price: oldPrice,
                                                is_sale: hasSale,
                                                is_new: Boolean(product.is_new),
                                                image: product.thumbnail_url || (product.thumbnail.startsWith('http') 
                                                    ? product.thumbnail 
                                                    : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${product.thumbnail}`)
                                            }} 
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-gray-50 rounded">
                                <p className="text-gray-500">Không tìm thấy sản phẩm nào phù hợp.</p>
                                <button 
                                    onClick={() => {setSelectedCategoryId(null); setFilterPriceId('all');}}
                                    className="mt-4 text-black underline font-bold"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    </div>
  );
}