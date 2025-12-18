"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  productService,
  Category,
  Attribute,
  ProductImage,
  ProductAttribute,
} from "@/services/product.service";
import {
  Save,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  X,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AxiosError } from "axios";

interface ProductFormInputs {
  name: string;
  category_id: string;
  price_buy: number;
  content: string;
  description: string;
  thumbnail: FileList;
  gallery: FileList;
  status: boolean;
}

// UI Helper for Attributes
interface AttributeRow {
  tempId: number;
  attributeId: string;
  values: string[];
  inputValue: string;
}

// Helper for displaying existing images from DB
interface ExistingImage {
  id: number;
  image: string;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params (Next.js 15+)
  const { id } = use(params);
  const router = useRouter();

  // Fixed: Removed unused 'watch'
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
  } = useForm<ProductFormInputs>({
    defaultValues: { status: true },
  });

  // Data Sources
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributesList, setAttributesList] = useState<Attribute[]>([]);

  // UI State for Images
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(
    null
  );
  const [newThumbnailPreview, setNewThumbnailPreview] = useState<string | null>(
    null
  );

  const [existingGallery, setExistingGallery] = useState<ExistingImage[]>([]);
  const [newGalleryPreview, setNewGalleryPreview] = useState<string[]>([]);

  // Attribute Management State
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([]);

  // 1. Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, attrRes, prodRes] = await Promise.all([
          productService.getCategories(),
          productService.getAttributes(),
          productService.getProductById(Number(id)),
        ]);

        if (catRes.status) setCategories(catRes.categories);
        if (attrRes.status) setAttributesList(attrRes.attributes);

        if (prodRes.status && prodRes.product) {
          const p = prodRes.product;

          // Populate Form Fields
          setValue("name", p.name);
          setValue(
            "category_id",
            p.category_id ? p.category_id.toString() : ""
          );
          setValue("price_buy", p.price_buy);
          setValue("content", p.content || "");
          setValue("description", p.description);
          setValue("status", p.status === 1);

          // Handle Images
          if (p.thumbnail) {
            setExistingThumbnail(
              p.thumbnail.startsWith("http")
                ? p.thumbnail
                : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${p.thumbnail}`
            );
          }

          // Fixed: Use ProductImage type instead of any
          if (p.images && p.images.length > 0) {
            setExistingGallery(
              p.images.map((img: ProductImage) => ({
                id: img.id,
                image: img.image.startsWith("http")
                  ? img.image
                  : `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${img.image}`,
              }))
            );
          }

          // Handle Attributes: Convert DB (Flat) -> UI (Grouped)
          const groupedAttrs: AttributeRow[] = [];
          // Check both likely property names from backend relation
          const attrs = p.product_attributes || p.attributes || [];

          if (attrs.length > 0) {
            const map = new Map<number, string[]>();
            // Fixed: Use ProductAttribute type instead of any
            attrs.forEach((attr: ProductAttribute) => {
              if (!map.has(attr.attribute_id)) {
                map.set(attr.attribute_id, []);
              }
              map.get(attr.attribute_id)?.push(attr.value);
            });

            map.forEach((values, key) => {
              groupedAttrs.push({
                tempId: Date.now() + Math.random(),
                attributeId: key.toString(),
                values: values,
                inputValue: "",
              });
            });
          }

          if (groupedAttrs.length === 0) {
            groupedAttrs.push({
              tempId: Date.now(),
              attributeId: "",
              values: [],
              inputValue: "",
            });
          }
          setAttributeRows(groupedAttrs);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        alert("Lỗi tải thông tin sản phẩm");
        router.push("/admin/products");
      }
    };
    loadData();
  }, [id, setValue, router]);

  // --- HANDLERS ---

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewThumbnailPreview(URL.createObjectURL(file));
      setExistingThumbnail(null); // Hide old if new selected
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setNewGalleryPreview(urls);
    }
  };

  // Attribute Logic
  const addAttributeRow = () => {
    setAttributeRows([
      ...attributeRows,
      { tempId: Date.now(), attributeId: "", values: [], inputValue: "" },
    ]);
  };

  const removeAttributeRow = (index: number) => {
    const newRows = [...attributeRows];
    newRows.splice(index, 1);
    setAttributeRows(newRows);
  };

  const updateRowAttribute = (index: number, attrId: string) => {
    const newRows = [...attributeRows];
    newRows[index].attributeId = attrId;
    setAttributeRows(newRows);
  };

  const handleValueKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = attributeRows[index].inputValue.trim();
      if (val && !attributeRows[index].values.includes(val)) {
        const newRows = [...attributeRows];
        newRows[index].values.push(val);
        newRows[index].inputValue = "";
        setAttributeRows(newRows);
      }
    }
  };

  const removeValueTag = (rowIndex: number, tagIndex: number) => {
    const newRows = [...attributeRows];
    newRows[rowIndex].values.splice(tagIndex, 1);
    setAttributeRows(newRows);
  };

  // Main Submit
  const onSubmit = async (data: ProductFormInputs) => {
    try {
      const formData = new FormData();
      // IMPORTANT: Laravel requires POST with _method="PUT" to handle file uploads in update
      formData.append("_method", "PUT");

      formData.append("name", data.name);
      formData.append("category_id", data.category_id);
      formData.append("price_buy", data.price_buy.toString());
      formData.append("content", data.content);
      formData.append("description", data.description || "");
      formData.append("status", data.status ? "1" : "0");

      // Only append thumbnail if a new one was selected
      if (data.thumbnail && data.thumbnail[0]) {
        formData.append("thumbnail", data.thumbnail[0]);
      }

      // Append new gallery images
      if (data.gallery && data.gallery.length > 0) {
        Array.from(data.gallery).forEach((file) => {
          formData.append("gallery[]", file);
        });
      }

      // Flatten attributes for backend
      const flatAttributes = attributeRows.flatMap((row) =>
        row.attributeId && row.values.length > 0
          ? row.values.map((val) => ({
              attribute_id: Number(row.attributeId),
              value: val,
            }))
          : []
      );

      formData.append("attributes", JSON.stringify(flatAttributes));

      await productService.updateProduct(Number(id), formData);
      alert("Cập nhật sản phẩm thành công!");
      router.push("/admin/products");
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 bg-white border rounded hover:bg-gray-50 text-gray-600"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Cập nhật sản phẩm
          </h1>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-white border rounded text-gray-600 font-medium hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2"
          >
            {isSubmitting ? (
              "Đang lưu..."
            ) : (
              <>
                <Save size={18} /> Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* --- LEFT COLUMN --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
              Thông tin chung
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Tên sản phẩm
                </label>
                <input
                  {...register("name", { required: true })}
                  className="w-full border border-gray-300 px-4 py-2 rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Giá bán (VNĐ)
                  </label>
                  <input
                    type="number"
                    {...register("price_buy", { required: true })}
                    className="w-full border border-gray-300 px-4 py-2 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Danh mục
                  </label>
                  <select
                    {...register("category_id", { required: true })}
                    className="w-full border border-gray-300 px-4 py-2 rounded bg-white"
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Content */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Nội dung chi tiết
            </label>
            <div className="border border-gray-300 rounded-md overflow-hidden">
              <textarea
                {...register("content", { required: true })}
                rows={8}
                className="w-full p-4 outline-none resize-y"
              ></textarea>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Mô tả ngắn
              </label>
              <textarea
                {...register("description")}
                rows={2}
                className="w-full border border-gray-300 px-4 py-2 rounded outline-none"
              ></textarea>
            </div>
          </div>

          {/* Attributes */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-gray-800">Thuộc tính & Biến thể</h3>
            </div>

            <div className="space-y-4">
              {attributeRows.map((row, index) => (
                <div
                  key={row.tempId}
                  className="p-4 bg-gray-50 rounded-md border border-gray-200 relative group"
                >
                  <button
                    type="button"
                    onClick={() => removeAttributeRow(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                        Tên thuộc tính
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                        value={row.attributeId}
                        onChange={(e) =>
                          updateRowAttribute(index, e.target.value)
                        }
                      >
                        <option value="">-- Chọn --</option>
                        {attributesList.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                        Giá trị (Nhấn Enter để thêm)
                      </label>
                      <div className="w-full border border-gray-300 rounded px-3 py-2 bg-white flex flex-wrap gap-2 min-h-[42px]">
                        {row.values.map((val, vIdx) => (
                          <span
                            key={vIdx}
                            className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1"
                          >
                            {val}
                            <button
                              type="button"
                              onClick={() => removeValueTag(index, vIdx)}
                              className="hover:text-red-600"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          className="flex-1 outline-none text-sm bg-transparent min-w-[100px]"
                          placeholder={
                            row.values.length === 0 ? "Nhập giá trị..." : ""
                          }
                          value={row.inputValue}
                          onChange={(e) => {
                            const newRows = [...attributeRows];
                            newRows[index].inputValue = e.target.value;
                            setAttributeRows(newRows);
                          }}
                          onKeyDown={(e) => handleValueKeyDown(index, e)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addAttributeRow}
                className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline mt-2"
              >
                <Plus size={16} /> Thêm thuộc tính khác
              </button>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN --- */}
        <div className="space-y-6">
          {/* Thumbnail */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Ảnh đại diện</h3>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition bg-gray-50">
              {newThumbnailPreview ? (
                <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-sm">
                  <Image
                    src={newThumbnailPreview}
                    alt="New Thumbnail"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : existingThumbnail ? (
                <div className="relative aspect-square w-full mb-3 rounded-md overflow-hidden shadow-sm">
                  <Image
                    src={existingThumbnail}
                    alt="Thumbnail"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-gray-400">
                  <Upload size={24} className="text-gray-500 mb-2" />
                  <p className="text-sm">Nhấn để thay đổi ảnh</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                {...register("thumbnail", { onChange: handleThumbnailChange })}
              />
            </div>
          </div>

          {/* Status */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
            <span className="font-bold text-gray-800">Hiển thị</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                {...register("status")}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Gallery */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Album ảnh</h3>

            {/* Existing Images */}
            {existingGallery.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 font-bold">
                  Ảnh hiện có:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {existingGallery.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square border rounded-md overflow-hidden group"
                    >
                      <Image
                        src={img.image}
                        alt="Gallery"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Uploads Preview */}
            {newGalleryPreview.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 font-bold">
                  Ảnh mới chọn:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {newGalleryPreview.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square border rounded-md overflow-hidden"
                    >
                      <Image
                        src={src}
                        alt="New Gallery"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-400 hover:text-blue-500 hover:border-blue-300 h-24">
              <ImageIcon size={20} />
              <span className="text-[10px] mt-1 font-bold">+ Thêm ảnh</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                {...register("gallery", { onChange: handleGalleryChange })}
              />
            </label>
          </div>
        </div>
      </form>
    </div>
  );
}
