<?php

// use Illuminate\Http\Request;
// use Illuminate\Support\Facades\Route;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\BannerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PostController; // Thêm PostController nếu chưa có
use App\Http\Controllers\Api\ContactController; // Thêm ContactController nếu chưa có
use App\Http\Controllers\Api\ProductStoreController;
use App\Http\Controllers\Api\ProductSaleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\TopicController;
use App\Http\Controllers\Api\AttributeController;



// --- AUTHENTICATION (JWT) ---
Route::group(['prefix' => 'auth'], function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('profile', [AuthController::class, 'profile']);
});

// --- PUBLIC DATA (SẢN PHẨM & DANH MỤC) ---
Route::get('products', [ProductController::class, 'index']); // Danh sách, Lọc, Tìm kiếm
Route::get('products/{slug}', [ProductController::class, 'show']); // Chi tiết sản phẩm

// --- QUẢN LÝ DANH MỤC ---
Route::get('categories', [CategoryController::class, 'index']);
Route::get('categories/{id}', [CategoryController::class, 'show']);
Route::post('categories', [CategoryController::class, 'store']);
Route::post('categories/{id}', [CategoryController::class, 'update']); // Dùng POST cho update có file ảnh (giả lập PUT bằng _method) hoặc PUT nếu không gửi file
Route::delete('categories/{id}', [CategoryController::class, 'destroy']);

// --- UI DATA (MENU & BANNER) ---
Route::get('menus/{position?}', [MenuController::class, 'index']);
Route::get('banners/{position?}', [BannerController::class, 'index']);

// --- CMS DATA (BÀI VIẾT & LIÊN HỆ) ---
Route::get('posts', [PostController::class, 'index']);
Route::get('posts/{slug}', [PostController::class, 'show']);
Route::post('contact', [ContactController::class, 'store']);

// --- ORDER (ĐẶT HÀNG) ---
Route::post('checkout', [OrderController::class, 'store']);

// --- QUẢN LÝ ĐƠN HÀNG (ADMIN) ---
// Đảm bảo đoạn này nằm ngoài các Group không liên quan hoặc nằm đúng chỗ bạn muốn
Route::get('orders', [OrderController::class, 'index']);       // Xem danh sách
Route::get('orders/{id}', [OrderController::class, 'show']);   // Xem chi tiết
Route::put('orders/{id}', [OrderController::class, 'update']); // Cập nhật trạng thái
Route::delete('orders/{id}', [OrderController::class, 'destroy']); // Xóa đơn


// --- QUẢN LÝ SẢN PHẨM (ADMIN) ---
// Thêm dòng này để cho phép POST (Thêm mới)
Route::post('products', [ProductController::class, 'store']); 

// Route cũ (Xem danh sách)
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{slug}', [ProductController::class, 'show']);
Route::put('products/{id}', [ProductController::class, 'update']);
Route::delete('products/{id}', [ProductController::class, 'destroy']);

// --- QUẢN LÝ KHO (INVENTORY) ---
Route::get('product-stores', [ProductStoreController::class, 'index']);
Route::post('product-stores/import', [ProductStoreController::class, 'import']);
Route::put('product-stores/{id}', [ProductStoreController::class, 'update']); // Mới
Route::delete('product-stores/{id}', [ProductStoreController::class, 'destroy']); // Mới

// --- QUẢN LÝ KHUYẾN MÃI (SALES) ---
Route::get('product-sales', [ProductSaleController::class, 'index']);
Route::post('product-sales', [ProductSaleController::class, 'store']);
Route::put('product-sales/{id}', [ProductSaleController::class, 'update']); // Mới
Route::delete('product-sales/{id}', [ProductSaleController::class, 'destroy']); // Mới

// --- QUẢN LÝ MENU ---
Route::get('menus', [MenuController::class, 'index']);
Route::get('menus/{id}', [MenuController::class, 'show']);
Route::post('menus', [MenuController::class, 'store']);
Route::put('menus/{id}', [MenuController::class, 'update']); // Dùng PUT để cập nhật
Route::delete('menus/{id}', [MenuController::class, 'destroy']);

// --- QUẢN LÝ NGƯỜI DÙNG (USERS) ---
Route::apiResource('users', UserController::class);

// --- QUẢN LÝ CHỦ ĐỀ (TOPIC) ---
Route::get('topics', [TopicController::class, 'index']);
Route::get('topics/{id}', [TopicController::class, 'show']);
Route::post('topics', [TopicController::class, 'store']);
Route::put('topics/{id}', [TopicController::class, 'update']);
Route::delete('topics/{id}', [TopicController::class, 'destroy']);

// --- QUẢN LÝ BÀI VIẾT (POST) ---
Route::get('posts', [PostController::class, 'index']);
Route::get('posts/{id}', [PostController::class, 'show']);
Route::post('posts', [PostController::class, 'store']); // Create (POST)
Route::post('posts/{id}', [PostController::class, 'update']); // Update (POST with _method=PUT to handle File)
Route::delete('posts/{id}', [PostController::class, 'destroy']);

// --- QUẢN LÝ BANNER ---
Route::get('banners', [BannerController::class, 'index']); // Public/Admin list
Route::get('banners/{id}', [BannerController::class, 'show']);
Route::post('banners', [BannerController::class, 'store']);
Route::post('banners/{id}', [BannerController::class, 'update']); // Use POST with _method=PUT for file upload
Route::delete('banners/{id}', [BannerController::class, 'destroy']);

Route::get('attributes', [AttributeController::class, 'index']);