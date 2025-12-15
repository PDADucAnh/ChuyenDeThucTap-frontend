<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $table = 'orders'; 
    protected $fillable = [
        'user_id', 'name', 'email', 'phone', 'address', 'note', 'status', 'created_by', 'updated_by'
    ];

    // Quan hệ: Đơn hàng thuộc về User
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    // Quan hệ: Đơn hàng có nhiều chi tiết
    public function order_details()
    {
        return $this->hasMany(OrderDetail::class, 'order_id', 'id');
    }
}