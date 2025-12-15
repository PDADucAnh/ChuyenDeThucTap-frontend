<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductSale;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductSaleController extends Controller
{
    // 1. Lấy danh sách (Giữ nguyên)
    public function index()
    {
        $sales = ProductSale::with(['product' => function($q) {
            $q->select('id', 'name');
        }])->orderBy('created_at', 'desc')->get();

        $data = $sales->map(function ($sale) {
            return [
                'id' => $sale->id,
                'name' => $sale->name,
                'product_id' => $sale->product_id,
                'product_name' => $sale->product ? $sale->product->name : 'N/A',
                'price_sale' => $sale->price_sale,
                'date_begin' => $sale->date_begin,
                'date_end' => $sale->date_end,
                'status' => $sale->status
            ];
        });

        return response()->json([
            'status' => true,
            'data' => $data
        ]);
    }

    // 2. Tạo mới (Giữ nguyên)
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'product_id' => 'required|exists:products,id',
            'price_sale' => 'required|numeric|min:0',
            'date_begin' => 'required|date',
            'date_end' => 'required|date|after:date_begin',
        ]);

        try {
            $sale = ProductSale::create([
                'name' => $request->name,
                'product_id' => $request->product_id,
                'price_sale' => $request->price_sale,
                'date_begin' => $request->date_begin,
                'date_end' => $request->date_end,
                'status' => 1,
                'created_by' => 1
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Tạo chương trình khuyến mãi thành công',
                'data' => $sale
            ], 201);

        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // 3. Cập nhật (MỚI)
    public function update(Request $request, $id)
    {
        $sale = ProductSale::find($id);
        if (!$sale) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy khuyến mãi'], 404);
        }

        $request->validate([
            'name' => 'required|string',
            'product_id' => 'required|exists:products,id',
            'price_sale' => 'required|numeric|min:0',
            'date_begin' => 'required|date',
            'date_end' => 'required|date|after:date_begin',
        ]);

        try {
            $sale->update([
                'name' => $request->name,
                'product_id' => $request->product_id,
                'price_sale' => $request->price_sale,
                'date_begin' => $request->date_begin,
                'date_end' => $request->date_end,
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Cập nhật thành công',
                'data' => $sale
            ]);

        } catch (\Exception $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // 4. Xóa (MỚI)
    public function destroy($id)
    {
        $sale = ProductSale::find($id);
        if (!$sale) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy khuyến mãi'], 404);
        }
        
        $sale->delete();
        return response()->json(['status' => true, 'message' => 'Xóa thành công']);
    }
}
