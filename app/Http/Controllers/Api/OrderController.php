<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // Import Log

class OrderController extends Controller
{
    // 1. Lấy danh sách đơn hàng (Có Debug)
    public function index(Request $request)
    {
        try {
            // Eager load
            $query = Order::with(['user', 'order_details.product'])
                ->orderBy('created_at', 'desc');

            // Filter Status
            if ($request->has('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter Keyword
            if ($request->has('keyword')) {
                $query->where(function($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->keyword . '%')
                      ->orWhere('phone', 'like', '%' . $request->keyword . '%')
                      ->orWhere('id', $request->keyword);
                });
            }

            $orders = $query->paginate(10);

            // Calculate Total
            $orders->getCollection()->transform(function ($order) {
                // Kiểm tra null safety
                $total = $order->order_details ? $order->order_details->sum('amount') : 0;
                $order->total_amount = $total;
                return $order;
            });

            return response()->json([
                'status' => true,
                'orders' => $orders
            ]);

        } catch (\Exception $e) {
            // Log lỗi ra file laravel.log
            Log::error('Order API Error: ' . $e->getMessage());
            
            // Trả về lỗi chi tiết cho Frontend thấy
            return response()->json([
                'status' => false,
                'message' => 'Lỗi Backend: ' . $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }

    // 2. Lấy chi tiết đơn hàng
    public function show($id)
    {
        $order = Order::with(['user', 'order_details.product'])->find($id);
        
        if (!$order) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
        }

        $order->total_amount = $order->order_details->sum('amount');

        return response()->json([
            'status' => true,
            'order' => $order
        ]);
    }

    // 3. Tạo đơn hàng (Đã có, giữ nguyên)
    public function store(Request $request)
    {
        // ... (Code cũ giữ nguyên)
        $request->validate([
            'name' => 'required',
            'phone' => 'required',
            'address' => 'required',
            'items' => 'required|array', 
        ]);

        DB::beginTransaction();
        try {
            $order = new Order();
            $order->user_id = auth('api')->check() ? auth('api')->id() : 1;
            $order->name = $request->name;
            $order->email = $request->email;
            $order->phone = $request->phone;
            $order->address = $request->address;
            $order->note = $request->note;
            $order->status = 1; // Mới
            $order->created_at = now();
            $order->save();

            foreach ($request->items as $item) {
                OrderDetail::create([
                    'order_id' => $order->id,
                    'product_id' => $item['id'],
                    'price' => $item['price'],
                    'qty' => $item['quantity'],
                    'amount' => $item['price'] * $item['quantity'],
                ]);
            }

            DB::commit();
            return response()->json(['status' => true, 'message' => 'Đặt hàng thành công', 'order_id' => $order->id]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['status' => false, 'message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    // 4. Cập nhật trạng thái đơn hàng
    public function update(Request $request, $id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
        }

        $request->validate([
            'status' => 'required|integer|in:1,2,3,4,5' // 1: Mới, 2: Xác nhận, 3: Đang giao, 4: Hoàn thành, 5: Hủy
        ]);

        $order->status = $request->status;
        $order->updated_by = auth('api')->id() ?? 1;
        $order->save();

        return response()->json([
            'status' => true, 
            'message' => 'Cập nhật trạng thái thành công', 
            'order' => $order
        ]);
    }

    // 5. Xóa đơn hàng
    public function destroy($id)
    {
        $order = Order::find($id);
        if (!$order) {
            return response()->json(['status' => false, 'message' => 'Không tìm thấy đơn hàng'], 404);
        }

        // Xóa chi tiết trước (nếu chưa cấu hình cascade delete ở DB)
        $order->order_details()->delete();
        $order->delete();

        return response()->json(['status' => true, 'message' => 'Xóa đơn hàng thành công']);
    }
}