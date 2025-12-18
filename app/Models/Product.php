<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage; // Import Storage


class Product extends Model
{
    use HasFactory;

    protected $table = 'products';

    // Khai báo các trường được phép thêm sửa (Mass Assignment)
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'thumbnail',
        'content',
        'description',
        'price_buy',
        'created_by',
        'updated_by',
        'status'
    ];

    protected $appends = ['thumbnail_url', 'sale_price'];

    // --- 1. Định nghĩa Accessor cho sale_price ---
    public function getSalePriceAttribute()
{
    // Kiểm tra xem có đợt giảm giá nào đang chạy không
    // (Ngày bắt đầu <= Hiện tại <= Ngày kết thúc)
    $activeSale = $this->sales
        ->where('status', 1)
        ->where('date_begin', '<=', now())
        ->where('date_end', '>=', now())
        ->sortByDesc('created_at') // Lấy cái mới nhất nếu có nhiều cái
        ->first();

    // Nếu có, trả về giá sale. Nếu không, trả về null
    return $activeSale ? $activeSale->price_sale : null;
}

    // --- 2. Định nghĩa Accessor cho thumbnail_url ---
    public function getThumbnailUrlAttribute()
    {
        // Nếu chưa có ảnh, trả về ảnh placeholder
        if (!$this->thumbnail) {
            return 'https://placehold.co/400x600?text=No+Image';    
        }

        // Nếu ảnh là link online (unsplash...) thì giữ nguyên
        if (str_starts_with($this->thumbnail, 'http')) {
            return $this->thumbnail;
        }

        // Nếu là ảnh upload, tạo URL đầy đủ (http://127.0.0.1:8000/storage/...)
        return asset('storage/' . $this->thumbnail);
    }

    // 1. Liên kết với bảng product_images (Một sản phẩm có nhiều ảnh)
    public function images()
    {
        return $this->hasMany(ProductImage::class, 'product_id', 'id');
    }

    // 2. Liên kết với bảng categories (Một sản phẩm thuộc 1 danh mục)
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id', 'id');
    }

    // 3. Liên kết với bảng product_stores (Kho hàng)
    public function store()
    {
        // Giả sử 1 sản phẩm có 1 dòng quản lý kho (hoặc hasMany nếu nhiều kho)
        // Dựa theo seeder bạn làm thì là hasOne hoặc hasMany. 
        // Thường kho đơn giản là hasOne hoặc hasMany lấy cái đầu tiên.
        return $this->hasOne(ProductStore::class, 'product_id', 'id');
    }

    // 4. Liên kết với bảng product_attributes (Size, Màu)
    public function product_attributes()
    {
        return $this->hasMany(ProductAttribute::class, 'product_id', 'id');
    }

    // 5. Liên kết với bảng product_sales (Khuyến mãi)
    public function sales()
    {
        return $this->hasMany(ProductSale::class, 'product_id', 'id');
    }
}
