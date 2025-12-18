<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Category;
use App\Models\ProductStore;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductAttribute;
// use App\Models\Attribute;
use Illuminate\Support\Str; // Nhớ import Str
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Reader\CSV\Reader as CsvReader;
class ProductController extends Controller
{
    // Lấy danh sách sản phẩm (Có lọc & phân trang)
    public function index(Request $request)
    {
        $query = Product::with(['images', 'sales']);

        // Lọc theo danh mục
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Lọc sản phẩm mới / sale
        if ($request->has('is_new')) {
            $query->where('is_new', 1);
        }
        if ($request->has('is_sale')) {
            $query->where('is_sale', 1);
        }

        // Tìm kiếm
        if ($request->has('keyword')) {
            $query->where('name', 'like', '%' . $request->keyword . '%');
        }

        // Sắp xếp
        if ($request->has('sort')) {
            if ($request->sort == 'price_asc')
                $query->orderBy('price_buy', 'asc');
            if ($request->sort == 'price_desc')
                $query->orderBy('price_buy', 'desc');
            if ($request->sort == 'newest')
                $query->orderBy('created_at', 'desc');
        }
        if ($request->has('price_min') && $request->has('price_max')) {
            $query->whereBetween('price_buy', [$request->price_min, $request->price_max]);
        }
        $products = $query->paginate(12); // Phân trang 12 sp

        return response()->json([
            'status' => true,
            'message' => 'Tải danh sách sản phẩm thành công',
            'products' => $products
        ]);
    }

    // Chi tiết sản phẩm
    public function show($id_or_slug)
    {
        // Logic: Tìm theo ID hoặc Slug
        $product = Product::where('id', $id_or_slug)
            ->orWhere('slug', $id_or_slug)
            ->with(['images', 'store', 'product_attributes', 'category', 'sales']) // Load thêm 'sales' để hiển thị giá KM nếu cần
            ->first();

        if (!$product) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy sản phẩm'], 404);
        }

        // Lấy sản phẩm liên quan (cùng danh mục, trừ sản phẩm hiện tại)
        $related_products = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->limit(4)
            ->get();

        return response()->json([
            'status' => true,
            'product' => $product,
            'related_products' => $related_products
        ]);
    }
    // Thêm mới sản phẩm
    public function store(Request $request)
    {
        // 1. Validate
        $request->validate([
            'name' => 'required|string|max:255|unique:products,name',
            'price_buy' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'thumbnail' => 'required|image|max:2048', // Ảnh đại diện bắt buộc
            'content' => 'required',
            'gallery.*' => 'image|max:2048', // Validate từng ảnh trong mảng gallery
        ], [
            'name.unique' => 'Tên sản phẩm đã tồn tại',
            'category_id.exists' => 'Danh mục không hợp lệ'
        ]);

        DB::beginTransaction();
        try {
            // 2. Upload Thumbnail
            $thumbnailPath = null;
            if ($request->hasFile('thumbnail')) {
                $thumbnailPath = $request->file('thumbnail')->store('products', 'public');
            }

            // 3. Create Slug
            $slug = Str::slug($request->name) . '-' . time();

            // 4. Save Product
            $product = Product::create([
                'name' => $request->name,
                'slug' => $slug,
                'category_id' => $request->category_id,
                'price_buy' => $request->price_buy,
                'content' => $request->input('content'),
                'description' => $request->description,
                'thumbnail' => $thumbnailPath,
                'status' => $request->status ?? 1,
                'is_new' => 1,
                'created_by' => auth('api')->id() ?? 1,
            ]);

            // 5. Save Gallery Images (product_images table)
            if ($request->hasFile('gallery')) {
                foreach ($request->file('gallery') as $file) {
                    $path = $file->store('products/gallery', 'public');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image' => $path,
                        'alt' => $product->name,
                    ]);
                }
            }

            // 6. Save Attributes (product_attributes table)
            // Frontend gửi lên dạng JSON string: '[{"attribute_id":1, "value":"XL"}, ...]'
            if ($request->has('attributes')) {
                $attributes = json_decode($request->input('attributes'), true);

                if (is_array($attributes)) {
                    foreach ($attributes as $attr) {
                        if (isset($attr['attribute_id']) && isset($attr['value'])) {
                            ProductAttribute::create([
                                'product_id' => $product->id,
                                'attribute_id' => $attr['attribute_id'],
                                'value' => $attr['value']
                            ]);
                        }
                    }
                }
            }

            // 7. Tạo tồn kho mặc định (nếu cần)
            // ProductStore::create(['product_id' => $product->id, 'qty' => 0, 'price_root' => 0]);

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Thêm sản phẩm thành công',
                'product' => $product
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            // Xóa ảnh thumbnail nếu lỗi (dọn dẹp)
            if (isset($thumbnailPath))
                Storage::disk('public')->delete($thumbnailPath);

            return response()->json([
                'status' => false,
                'message' => 'Lỗi server: ' . $e->getMessage()
            ], 500);
        }
    }

    // --- HÀM CẬP NHẬT SẢN PHẨM ---
    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        if (!$product) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy sản phẩm'], 404);
        }

        // Validate (Lưu ý: unique bỏ qua ID hiện tại)
        $request->validate([
            'name' => 'required|string|max:255|unique:products,name,' . $id,
            'price_buy' => 'required|numeric|min:0',
            'category_id' => 'required|exists:categories,id',
            'content' => 'required',
            'thumbnail' => 'nullable|image|max:2048', // Thumbnail không bắt buộc khi update
            'gallery.*' => 'image|max:2048'
        ]);

        DB::beginTransaction();
        try {
            // Update Thumbnail
            $thumbnailPath = $product->thumbnail;
            if ($request->hasFile('thumbnail')) {
                // Xóa ảnh cũ
                if ($product->thumbnail && Storage::disk('public')->exists($product->thumbnail)) {
                    Storage::disk('public')->delete($product->thumbnail);
                }
                $thumbnailPath = $request->file('thumbnail')->store('products', 'public');
            }

            // Update Slug nếu tên đổi
            $slug = $request->name !== $product->name ? Str::slug($request->name) . '-' . time() : $product->slug;

            $product->update([
                'name' => $request->name,
                'slug' => $slug,
                'category_id' => $request->category_id,
                'price_buy' => $request->price_buy,
                'content' => $request->input('content'),
                'description' => $request->description,
                'thumbnail' => $thumbnailPath,
                'status' => $request->status ?? $product->status,
                // ADD THESE LINES:
                'is_new' => $request->has('is_new') ? $request->is_new : $product->is_new,
                'is_sale' => $request->has('is_sale') ? $request->is_sale : $product->is_sale,
                'updated_by' => auth('api')->id() ?? 1,
            ]);

            // Update Attributes (Xóa hết cũ -> Tạo mới)
            // Đây là cách đơn giản nhất để đồng bộ
            if ($request->has('attributes')) {
                ProductAttribute::where('product_id', $product->id)->delete();

                $attributes = json_decode($request->input('attributes'), true);
                if (is_array($attributes)) {
                    foreach ($attributes as $attr) {
                        if (isset($attr['attribute_id']) && isset($attr['value'])) {
                            ProductAttribute::create([
                                'product_id' => $product->id,
                                'attribute_id' => $attr['attribute_id'],
                                'value' => $attr['value']
                            ]);
                        }
                    }
                }
            }

            // Update Gallery (Thêm ảnh mới vào)
            // Nếu muốn xóa ảnh cũ trong gallery, cần API riêng hoặc logic phức tạp hơn (gửi danh sách ID ảnh cần xóa)
            if ($request->hasFile('gallery')) {
                foreach ($request->file('gallery') as $file) {
                    $path = $file->store('products/gallery', 'public');
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image' => $path,
                        'alt' => $product->name,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Cập nhật thành công',
                'product' => $product
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // destroy (keep existing)



    public function destroy($id)
    {
        try {
            // 1. Tìm sản phẩm theo ID
            $product = Product::findOrFail($id);

            // 2. Xóa ảnh đại diện trong Storage (Nếu có)
            if ($product->thumbnail && Storage::disk('public')->exists($product->thumbnail)) {
                Storage::disk('public')->delete($product->thumbnail);
            }

            // 3. Xóa sản phẩm khỏi DB
            $product->delete();

            return response()->json([
                'status' => true,
                'message' => 'Đã xóa sản phẩm thành công'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => false,
                'message' => 'Lỗi khi xóa: ' . $e->getMessage()
            ], 500);
        }
    }
    // --- NEW: IMPORT EXCEL ---
    public function import(Request $request)
    {
        // 1. Validate File
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240', // Max 10MB
        ]);

        DB::beginTransaction();
        try {
            $file = $request->file('file');
            $filePath = $file->getPathname();
            $extension = strtolower($file->getClientOriginalExtension());

            // 2. Select Reader based on extension (OpenSpout v4 style)
            if ($extension === 'csv') {
                $reader = new CsvReader();
            } else {
                $reader = new XlsxReader();
            }

            $reader->open($filePath);

            $isHeader = true;

            foreach ($reader->getSheetIterator() as $sheet) {
                foreach ($sheet->getRowIterator() as $row) {
                    // Skip the first row (Header)
                    if ($isHeader) {
                        $isHeader = false;
                        continue;
                    }

                    // Get cells as an array
                    $cells = $row->toArray();

                    // Ensure we have enough columns (Avoid index errors)
                    if (count($cells) < 3)
                        continue;

                    // --- MAPPING DATA ---
                    // 0: Name, 1: Category, 2: Price, 3: Qty, 4: Cost, 5: Desc, 6: Content, 7: Thumbnail
                    $name = $cells[0] ?? 'No Name';
                    $catName = $cells[1] ?? 'Uncategorized';
                    $price = is_numeric($cells[2] ?? 0) ? $cells[2] : 0;
                    $qty = is_numeric($cells[3] ?? 0) ? $cells[3] : 0;
                    $cost = is_numeric($cells[4] ?? 0) ? $cells[4] : ($price * 0.7);
                    $desc = $cells[5] ?? '';
                    $content = $cells[6] ?? '';
                    $thumb = $cells[7] ?? null;

                    // 3. Logic: Find or Create Category
                    $category = Category::firstOrCreate(
                        ['name' => $catName],
                        ['slug' => Str::slug($catName), 'status' => 1]
                    );

                    // 4. Create Product
                    $product = Product::create([
                        'category_id' => $category->id,
                        'name' => $name,
                        'slug' => Str::slug($name) . '-' . time() . '-' . rand(100, 999),
                        'price_buy' => $price,
                        'content' => $content,
                        'description' => $desc,
                        'thumbnail' => $thumb,
                        'status' => 1,
                        'is_new' => 1,
                        'created_by' => auth('api')->id() ?? 1,
                    ]);

                    // 5. Create Inventory
                    ProductStore::create([
                        'product_id' => $product->id,
                        'price_root' => $cost,
                        'qty' => $qty,
                        'status' => 1
                    ]);

                    // 6. Add Image to Gallery (Optional)
                    if ($thumb) {
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image' => $thumb,
                            'alt' => $name,
                        ]);
                    }
                }
                // Only process the first sheet
                break;
            }

            $reader->close();
            DB::commit();

            return response()->json([
                'status' => true,
                'message' => 'Import successfully via OpenSpout!'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'status' => false,
                'message' => 'Import Failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
