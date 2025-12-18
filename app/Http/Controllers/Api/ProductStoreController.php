<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductStore;
use App\Models\Product; // Thêm dòng này để import Model Product
use Illuminate\Http\Request;

class ProductStoreController extends Controller
{
    // 1. Lấy danh sách tồn kho
    public function index()
    {
        // Load kèm thông tin sản phẩm và ảnh
        // Lưu ý: Trong model ProductStore phải có function product() belongsTo Product
        $stores = ProductStore::with(['product' => function($q) {
            $q->select('id', 'name', 'thumbnail');
        }])->orderBy('updated_at', 'desc')->get();

        // Format lại dữ liệu cho đẹp nếu cần (Flatten)
        $data = $stores->map(function ($store) {
            return [
                'id' => $store->id,
                'product_id' => $store->product_id,
                'product_name' => $store->product ? $store->product->name : 'Sản phẩm đã xóa',
                'product_image' => $store->product ? $store->product->thumbnail : null,
                'price_root' => $store->price_root,
                'qty' => $store->qty,
                'updated_at' => $store->updated_at,
            ];
        });

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

    // 2. Nhập kho (Import)
    public function import(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'qty' => 'required|integer|min:1',
            'price_root' => 'required|numeric|min:0',
        ]);

        try {
            // Tìm xem sản phẩm này đã có trong kho chưa
            $store = ProductStore::where('product_id', $request->product_id)->first();

            if ($store) {
                // Nếu có rồi -> Cộng thêm số lượng & Cập nhật giá vốn mới nhất
                $store->qty += $request->qty;
                $store->price_root = $request->price_root; // Hoặc logic tính giá bình quân tùy bạn
                $store->updated_at = now();
                $store->save();
            } else {
                // Nếu chưa có -> Tạo mới
                $store = ProductStore::create([
                    'product_id' => $request->product_id,
                    'qty' => $request->qty,
                    'price_root' => $request->price_root,
                    'created_by' => 1 // Admin
                ]);
            }
            
            // Cập nhật lại tổng tồn kho trong bảng products (nếu bảng products có cột stock_quantity để cache)
            // $product = Product::find($request->product_id);
            // $product->stock_quantity = $store->qty;
            // $product->save();

            return response()->json([
                'status' => true,
                'message' => 'Nhập kho thành công',
                'data' => $store
            ]);

        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

        // 3. Cập nhật Kho (Sửa trực tiếp số lượng/giá vốn)
    public function update(Request $request, $id)
    {
        $store = ProductStore::find($id);
        if (!$store) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy kho'], 404);
        }

        $request->validate([
            'qty' => 'required|integer|min:0',
            'price_root' => 'required|numeric|min:0',
        ]);

        $store->qty = $request->qty;
        $store->price_root = $request->price_root;
        $store->save();

        return response()->json([
            'status' => true,
            'message' => 'Cập nhật kho thành công',
            'data' => $store
        ]);
    }

    // 4. Xóa dòng kho (Reset về 0 hoặc xóa hẳn)
    public function destroy($id)
    {
        $store = ProductStore::find($id);
        if (!$store) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy kho'], 404);
        }
        
        $store->delete();
        return response()->json(['status' => true, 'message' => 'Xóa thành công']);
    }

}