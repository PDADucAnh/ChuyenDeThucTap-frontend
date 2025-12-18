"use client";

import { useEffect, useState, useRef } from "react";
import {
  promotionService,
  Promotion,
  PromotionBatchPayload,
} from "@/services/promotion.service";
import { productService, Product } from "@/services/product.service";
import {
  Plus,
  Search,
  Upload,
  Loader2,
  X,
  Edit,
  Save,
  RefreshCw,
  Tag,
  Download,
  Percent,
  DollarSign,
  Calculator,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";

// Interface for the Editor state (UI)
interface SelectedProduct extends Product {
  price_sale: number;
  sale_id?: number; // Exists if we are editing an existing record
}

// Interface for grouping campaigns in the list
interface CampaignGroup {
  name: string;
  date_begin: string;
  date_end: string;
  items: Promotion[]; // The raw sale items
}

// Interface for Import Response (matches backend JSON structure)
interface ImportItem {
  product_id: number;
  price_sale: number;
}

interface ImportResponse {
  status: boolean;
  data: ImportItem[];
}

export default function PromotionsPage() {
  // --- STATE: PRODUCT SALES ---
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignGroup[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );

  // Form State
  const [campaignName, setCampaignName] = useState("Flash Sale Mới");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditingMode, setIsEditingMode] = useState(false);

  // --- NEW STATE: QUICK SETUP OPTIONS ---
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState<number>(10);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [prodRes, saleRes] = await Promise.all([
      productService.getProducts({ limit: 1000 }),
      promotionService.getPromotions(),
    ]);

    if (prodRes.status) setAllProducts(prodRes.products.data);

    if (saleRes.status) {
      // Group raw sales by "Campaign Name" to simulate programs
      const rawSales = saleRes.data;
      const groups: { [key: string]: CampaignGroup } = {};

      rawSales.forEach((sale) => {
        const key = sale.name; // Group by Name
        if (!groups[key]) {
          groups[key] = {
            name: sale.name,
            date_begin: sale.date_begin,
            date_end: sale.date_end,
            items: [],
          };
        }
        groups[key].items.push(sale);
      });

      setCampaigns(Object.values(groups));
    }
  };

  // --- LOGIC: PRODUCT SALES ---

  // 1. Add Product to List (New Item)
  const handleAddProduct = (product: Product) => {
    if (selectedProducts.find((p) => p.id === product.id && !p.sale_id)) return;
    
    // Default logic: apply current quick setup rule immediately when adding
    let defaultSale = product.price_buy;
    if (discountType === 'percent') {
        defaultSale = Math.floor(product.price_buy * ((100 - discountValue) / 100));
    } else {
        defaultSale = Math.max(0, product.price_buy - discountValue);
    }

    // Safety check for initialization
    if(defaultSale > product.price_buy) defaultSale = product.price_buy;

    setSelectedProducts([
      ...selectedProducts,
      { ...product, price_sale: defaultSale },
    ]);
  };

  // 2. Remove Product
  const handleRemoveProduct = async (product: SelectedProduct) => {
    if (product.sale_id) {
      if (
        !confirm(
          "Sản phẩm này đang nằm trong chương trình đã lưu. Bạn có chắc muốn xóa ngay lập tức?"
        )
      )
        return;
      try {
        await promotionService.deletePromotion(product.sale_id);
        // Remove from UI
        setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
        loadData(); // Refresh campaign list below
      } catch (error: unknown) {
        console.error(error);
        alert("Lỗi khi xóa sản phẩm");
      }
    } else {
      // Just remove from UI state (not saved yet)
      setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id));
    }
  };

  // 3. Save (Upsert)
  const handleSaveSales = async () => {
    if (!startDate || !endDate) return alert("Vui lòng chọn thời gian");
    if (selectedProducts.length === 0) return alert("Chọn ít nhất 1 sản phẩm");

    setIsLoading(true);
    try {
      const payload: PromotionBatchPayload = {
        name: campaignName,
        date_begin: startDate,
        date_end: endDate,
        products: selectedProducts.map((p) => ({
          sale_id: p.sale_id || null, // ID exists = Update, Null = Create
          product_id: p.id,
          price_sale: p.price_sale,
        })),
      };

      await promotionService.saveBatchPromotions(payload);
      alert("Đã lưu chương trình khuyến mãi!");
      resetEditor();
      loadData(); // Refresh list
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert("Lỗi: " + err.message);
      } else {
        alert("Đã xảy ra lỗi không xác định");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Load Campaign into Editor (Edit Mode)
  const handleEditCampaign = (camp: CampaignGroup) => {
    setIsEditingMode(true);
    setCampaignName(camp.name);
    setStartDate(camp.date_begin.slice(0, 16));
    setEndDate(camp.date_end.slice(0, 16));

    // Map existing sale items back to Product format
    const mappedProducts = camp.items
      .map((item) => {
        const productInfo = allProducts.find((p) => p.id === item.product_id);
        if (!productInfo) return null;
        return {
          ...productInfo,
          price_sale: item.price_sale,
          sale_id: item.id, // Important: Track ID for updates
        };
      })
      .filter(Boolean) as SelectedProduct[];

    setSelectedProducts(mappedProducts);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetEditor = () => {
    setIsEditingMode(false);
    setCampaignName("");
    setStartDate("");
    setEndDate("");
    setSelectedProducts([]);
  };

  // --- NEW: BULK DISCOUNT LOGIC ---
  const applyBulkDiscount = () => {
    if (selectedProducts.length === 0) return alert("Hãy chọn sản phẩm trước!");
    
    const updated = selectedProducts.map(p => {
        let newPrice = p.price_buy;
        if (discountType === 'percent') {
            // Formula: Price * (100 - percent) / 100
            newPrice = Math.floor(p.price_buy * ((100 - discountValue) / 100));
        } else {
            // Formula: Price - Fixed Amount
            newPrice = p.price_buy - discountValue;
        }
        
        // Validation: Price cannot be negative
        if (newPrice < 0) newPrice = 0;
        
        // Validation: Price cannot be higher than original (User constraint)
        if (newPrice > p.price_buy) newPrice = p.price_buy;

        return { ...p, price_sale: newPrice };
    });

    setSelectedProducts(updated);
  };

  // --- UI HELPERS ---

  // RESTORED: Generate Excel Template
  const handleDownloadTemplate = () => {
    // Simple CSV generation client-side
    const headers = [
      "product_id",
      "sale_price",
      "product_name_hint",
      "current_price_hint",
    ];

    // Take up to 10 products as examples
    const rows = allProducts.slice(0, 10).map((p) => [
      p.id,
      Math.floor(p.price_buy * 0.9), // Example: 10% off
      `"${p.name.replace(/"/g, '""')}"`, // Escape double quotes for CSV to prevent breaking
      p.price_buy,
    ]);

    // 1. Join content with newlines
    const csvString =
      headers.join(",") + "\n" + rows.map((e) => e.join(",")).join("\n");

    // 2. Create a Blob with the BOM (\uFEFF) at the very start of the file content
    // This ensures Excel opens the file in UTF-8 mode (readable Vietnamese)
    const blob = new Blob(["\uFEFF" + csvString], {
      type: "text/csv;charset=utf-8;",
    });

    // 3. Create a download link using the Blob URL
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "template_promotion.csv");
    document.body.appendChild(link);
    link.click();

    // 4. Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  // Import Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Fix: Cast to ImportResponse instead of any
      const res = (await promotionService.importPromotion(
        formData
      )) as unknown as ImportResponse;

      if (res.status && res.data) {
        const imported = res.data
          .map((item: ImportItem) => {
            const p = allProducts.find((prod) => prod.id === item.product_id);
            // Validation on Import: Check if sale price > buy price
            if(p && item.price_sale > p.price_buy) {
                return { ...p, price_sale: p.price_buy }; // Clamp it
            }
            return p ? { ...p, price_sale: item.price_sale } : null;
          })
          .filter(Boolean) as SelectedProduct[];

        // Merge logic
        setSelectedProducts((prev) => {
          const map = new Map();
          [...prev, ...imported].forEach((i) => map.set(i.id, i));
          return Array.from(map.values());
        });
        alert(`Nhập thành công ${imported.length} sản phẩm`);
      }
    } catch (error: unknown) {
      console.error(error);
      alert("Lỗi nhập file");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Quản lý Khuyến Mãi
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: COMMON TIME SETTINGS & QUICK SETUP */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 sticky top-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Edit size={18} className="text-gray-600" />
                {isEditingMode ? "Chỉnh sửa chương trình" : "Thiết lập chung"}
              </h3>
              {isEditingMode && (
                <button
                  onClick={resetEditor}
                  className="text-xs text-gray-500 hover:text-red-500 underline"
                >
                  Hủy / Tạo mới
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Tên chương trình (Ghi nhớ)
                </label>
                <input
                  type="text"
                  className="w-full border p-2 rounded text-sm"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="VD: Flash Sale tháng 10"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border p-2 rounded text-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border p-2 rounded text-sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* === NEW: QUICK SETUP / BULK EDIT SECTION === */}
              <div className="bg-orange-50 p-3 rounded border border-orange-100 mt-4">
                <h4 className="text-sm font-bold text-orange-800 flex items-center gap-1 mb-2">
                    <Calculator size={14}/> Thiết lập giá nhanh
                </h4>
                <div className="text-xs text-gray-500 mb-2">
                    Áp dụng cho tất cả sản phẩm đã chọn bên dưới.
                </div>
                
                <div className="flex gap-2 mb-2">
                    <button 
                        onClick={() => setDiscountType('percent')}
                        className={`flex-1 py-1 px-2 rounded text-xs border flex items-center justify-center gap-1
                        ${discountType === 'percent' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600'}`}
                    >
                        <Percent size={12}/> Theo %
                    </button>
                    <button 
                         onClick={() => setDiscountType('fixed')}
                         className={`flex-1 py-1 px-2 rounded text-xs border flex items-center justify-center gap-1
                         ${discountType === 'fixed' ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-gray-600'}`}
                    >
                        <DollarSign size={12}/> Số tiền cố định
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <input 
                            type="number" 
                            className="w-full border p-1.5 rounded text-sm"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Number(e.target.value))}
                            placeholder={discountType === 'percent' ? "VD: 20 (%)" : "VD: 50000"}
                        />
                    </div>
                    <button 
                        onClick={applyBulkDiscount}
                        className="bg-gray-800 text-white px-3 py-1 rounded text-xs hover:bg-black transition flex items-center"
                        title="Tính toán và áp dụng cho danh sách"
                    >
                        Áp dụng <ArrowRight size={12} className="ml-1"/>
                    </button>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 italic">
                    {discountType === 'percent' 
                        ? `Giảm ${discountValue}% giá trị sản phẩm.` 
                        : `Giảm trực tiếp ${discountValue.toLocaleString()}đ trên mỗi sản phẩm.`
                    }
                </div>
              </div>
              {/* === END QUICK SETUP === */}


              {/* Save Button for Products */}
              <div className="border-t pt-4 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold">
                    Danh sách ({selectedProducts.length})
                  </span>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1"
                  >
                    <Plus size={12} /> Thêm sp
                  </button>
                </div>

                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {selectedProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-100"
                    >
                      <div className="w-8 h-8 relative rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={
                            p.thumbnail_url ||
                            `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${p.thumbnail}`
                          }
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-gray-500 line-through">
                          {p.price_buy.toLocaleString()}
                        </div>
                      </div>
                      <input
                        type="number"
                        className="w-20 border rounded p-1 text-xs text-right font-bold text-orange-600"
                        value={p.price_sale}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          
                          // --- VALIDATION ADDED HERE ---
                          if(val > p.price_buy) {
                              alert("Giá KM không lớn hơn giá nhập");
                              return; // Reject the change
                          }
                          // -----------------------------

                          setSelectedProducts(
                            selectedProducts.map((sp) =>
                              sp.id === p.id ? { ...sp, price_sale: val } : sp
                            )
                          );
                        }}
                      />
                      <button
                        onClick={() => handleRemoveProduct(p)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {selectedProducts.length === 0 && (
                    <div className="text-center text-xs text-gray-400 py-4">
                      Chưa có sản phẩm
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSaveSales}
                disabled={isLoading}
                className="w-full bg-orange-600 text-white py-3 rounded font-bold hover:bg-orange-700 flex justify-center items-center gap-2 mt-4 shadow-lg"
              >
                {isLoading && <Loader2 className="animate-spin" size={16} />}
                <Save size={18} />{" "}
                {isEditingMode ? "Cập nhật thay đổi" : "Lưu chương trình"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: CONTENT AREA */}
        <div className="lg:col-span-2 space-y-6">
          {/* --- TAB: PRODUCT SALES DASHBOARD --- */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 min-h-[500px]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <div className="flex gap-2">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Tag size={20} className="text-orange-600" /> Các chương trình
                  đang chạy
                </h3>

                {/* --- RESTORED DOWNLOAD TEMPLATE BUTTON --- */}
                <button
                  onClick={handleDownloadTemplate}
                  className="text-xs bg-gray-100 px-2 py-1 rounded border flex items-center gap-1 hover:bg-gray-200 ml-4"
                >
                  <Download size={12} /> Tải file mẫu
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 flex items-center gap-1 hover:bg-blue-100"
                >
                  <Upload size={12} /> Nhập Excel
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.xlsx"
                  onChange={handleImportExcel}
                />
              </div>
              <button
                onClick={loadData}
                className="text-gray-500 hover:text-blue-600"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {campaigns.map((camp, idx) => {
                const isActive = new Date(camp.date_end) > new Date();
                return (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 hover:border-orange-300 transition bg-white group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">
                          {camp.name}
                        </h4>
                        <div className="text-xs text-gray-500 flex gap-4 mt-1">
                          <span>
                            Start: {new Date(camp.date_begin).toLocaleString()}
                          </span>
                          <span>
                            End: {new Date(camp.date_end).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {isActive ? "Active" : "Expired"}
                        </span>
                        <button
                          onClick={() => handleEditCampaign(camp)}
                          className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded text-sm font-bold hover:bg-blue-100 flex items-center gap-1"
                        >
                          <Edit size={14} /> Chỉnh sửa / Xem
                        </button>
                      </div>
                    </div>

                    {/* Mini Preview of items */}
                    <div className="bg-gray-50 p-3 rounded flex gap-2 overflow-x-auto">
                      {camp.items.slice(0, 6).map((item, i) => (
                        <div
                          key={i}
                          className="flex-shrink-0 w-24 border bg-white rounded p-2 text-center"
                        >
                          <div className="text-[10px] text-gray-500 truncate mb-1">
                            {item.product_name || "Unknown"}
                          </div>
                          <div className="font-bold text-orange-600 text-sm">
                            {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: "VND",
                              maximumFractionDigits: 0,
                            }).format(item.price_sale)}
                          </div>
                        </div>
                      ))}
                      {camp.items.length > 6 && (
                        <div className="flex-shrink-0 w-24 flex items-center justify-center text-xs text-gray-500 font-medium">
                          +{camp.items.length - 6} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {campaigns.length === 0 && (
                <div className="text-center text-gray-400 py-10">
                  Chưa có chương trình nào. Hãy tạo mới ở bên trái.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL SELECT PRODUCTS --- */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-lg">Chọn sản phẩm thêm vào</h3>
              <button onClick={() => setShowProductModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4 border-b">
              <div className="relative">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Tìm tên sản phẩm..."
                  className="w-full pl-10 pr-4 py-2 border rounded"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {allProducts
                .filter((p) =>
                  p.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((product) => {
                  const isSelected = selectedProducts.some(
                    (sp) => sp.id === product.id
                  );
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded cursor-pointer border mb-2 transition
                                                  ${
                                                    isSelected
                                                      ? "bg-blue-50 border-blue-200 opacity-50"
                                                      : "hover:bg-gray-50 border-gray-100"
                                                  }`}
                      onClick={() => !isSelected && handleAddProduct(product)}
                    >
                      <div className="w-12 h-12 relative border rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={
                            product.thumbnail_url ||
                            `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${product.thumbnail}`
                          }
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.price_buy.toLocaleString()} đ
                        </div>
                      </div>
                      {!isSelected && (
                        <Plus size={18} className="text-gray-400" />
                      )}
                    </div>
                  );
                })}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button
                onClick={() => setShowProductModal(false)}
                className="bg-black text-white px-6 py-2 rounded text-sm font-bold uppercase"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}