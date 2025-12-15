'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ChevronRight, CreditCard, Truck, Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';

import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import axiosInstance from '@/lib/axios';

// Import Service địa điểm thật
import { locationService, Location } from '@/services/location.service';

// Interface Payload gửi lên Backend Laravel
interface OrderPayload {
    name: string;
    email: string;
    phone: string;
    address: string;
    note?: string;
    items: {
        id: number;
        price: number;
        quantity: number;
    }[];
}

// Schema Validation
const checkoutSchema = z.object({
    fullName: z.string().min(1, "Vui lòng nhập họ tên"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().min(10, "Số điện thoại không hợp lệ").regex(/^[0-9]+$/, "Chỉ được nhập số"),
    address: z.string().min(1, "Vui lòng nhập số nhà, tên đường"),
    province: z.string().min(1, "Vui lòng chọn Tỉnh/Thành phố"),
    district: z.string().min(1, "Vui lòng chọn Quận/Huyện"),
    ward: z.string().min(1, "Vui lòng chọn Phường/Xã"),
    note: z.string().optional(),
    paymentMethod: z.enum(['momo', 'card', 'bank']).optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
    const router = useRouter();
    const { items, clearCart } = useCartStore();
    const { user } = useAuthStore();

    // State quản lý
    const [isClient, setIsClient] = useState(false);
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [shippingFee, setShippingFee] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    // State Địa điểm (Real Data)
    const [provinces, setProvinces] = useState<Location[]>([]);
    const [districts, setDistricts] = useState<Location[]>([]);
    const [wards, setWards] = useState<Location[]>([]);

    const totalPrice = useMemo(() => {
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [items]);

    const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<CheckoutForm>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: { 
            paymentMethod: 'momo',
            fullName: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
        }
    });

    // Theo dõi thay đổi dropdown
    const selectedProvince = watch('province');
    const selectedDistrict = watch('district');
    const selectedPayment = watch('paymentMethod');

    // 1. Init Client & Load Tỉnh/Thành
    useEffect(() => { 
        setIsClient(true);
        const fetchProvinces = async () => {
            const data = await locationService.getProvinces();
            setProvinces(data);
        };
        fetchProvinces();
    }, []);

    // 2. Redirect nếu giỏ hàng trống
    useEffect(() => {
        if (isClient && items.length === 0) {
            router.push('/cart');
        }
    }, [isClient, items, router]);

    // 3. Auto-fill user info
    useEffect(() => {
        if (user) {
            setValue('fullName', user.name);
            setValue('email', user.email);
            if (user.phone) setValue('phone', user.phone);
        }
    }, [user, setValue]);

    // 4. Logic Load Quận/Huyện khi chọn Tỉnh
    useEffect(() => {
        if (selectedProvince) {
            const fetchDistricts = async () => {
                const data = await locationService.getDistricts(selectedProvince);
                setDistricts(data);
                setWards([]); 
                setValue('district', ''); 
                setValue('ward', '');
            };
            fetchDistricts();
        } else {
            setDistricts([]);
            setWards([]);
        }
    }, [selectedProvince, setValue]);

    // 5. Logic Load Phường/Xã khi chọn Quận
    useEffect(() => {
        if (selectedDistrict) {
            const fetchWards = async () => {
                const data = await locationService.getWards(selectedDistrict);
                setWards(data);
                setValue('ward', '');
            };
            fetchWards();
        } else {
            setWards([]);
        }
    }, [selectedDistrict, setValue]);

    const onSubmit = async (data: CheckoutForm) => {
        if (currentStep === 1) {
            // Validate Step 1
            const isValid = await trigger(['fullName', 'email', 'phone', 'address', 'province', 'district', 'ward']);
            if (isValid) {
                setShippingFee(30000); // Có thể tính phí ship động ở đây
                setCurrentStep(2);
                window.scrollTo(0, 0);
            }
        } else {
            // Step 2: Gửi API Đặt hàng
            setIsProcessing(true);
            try {
                // Lấy tên địa điểm từ ID để lưu vào DB cho đẹp
                const provinceName = provinces.find(p => p.id === data.province)?.name || '';
                const districtName = districts.find(d => d.id === data.district)?.name || '';
                const wardName = wards.find(w => w.id === data.ward)?.name || '';

                const fullAddress = `${data.address}, ${wardName}, ${districtName}, ${provinceName}`;

                const payload: OrderPayload = {
                    name: data.fullName,
                    email: data.email,
                    phone: data.phone,
                    address: fullAddress,
                    note: data.note || '',
                    items: items.map(item => ({
                        id: item.id,
                        price: item.price,
                        quantity: item.quantity
                    }))
                };

                // Gọi API Laravel
                await axiosInstance.post('/checkout', payload);

                alert("Đặt hàng thành công! Cảm ơn bạn đã mua sắm.");
                clearCart();
                router.push('/'); 
            } catch (error) {
                const err = error as AxiosError<{ message: string }>;
                const message = err.response?.data?.message || err.message || "Lỗi không xác định";
                alert("Lỗi đặt hàng: " + message);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    if (!isClient || items.length === 0) return null;

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-5 gap-8 py-8">
                
                {/* --- LEFT COLUMN --- */}
                <div className="lg:col-span-3 order-2 lg:order-1">
                    <div className="mb-6">
                       <Link href="/">
                            <div className="relative w-28 h-10">
                                <Image src="/logo.png" alt="Logo" fill className="object-contain" priority/>
                            </div>
                        </Link>
                    </div>
                    
                    <div className="flex items-center text-xs md:text-sm text-gray-500 mb-6 flex-wrap gap-2">
                        <Link href="/cart" className="text-blue-600 hover:underline">Giỏ hàng</Link> 
                        <ChevronRight size={14} />
                        <span className={currentStep === 1 ? 'font-bold text-black' : ''}>Thông tin vận chuyển</span>
                        <ChevronRight size={14} />
                        <span className={currentStep === 2 ? 'font-bold text-black' : ''}>Phương thức thanh toán</span>
                    </div>

                    <h2 className="text-xl font-bold uppercase mb-6">
                        {currentStep === 1 ? 'Thông tin thanh toán' : 'Phương thức vận chuyển & Thanh toán'}
                    </h2>

                    {currentStep === 1 && !user && (
                         <div className="mb-6 text-sm">
                             Bạn đã có tài khoản? <Link href="/login" className="text-blue-600 hover:underline font-medium">Đăng nhập</Link>
                         </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* === STEP 1 === */}
                        <div className={currentStep === 1 ? 'block' : 'hidden'}>
                            <div className="mb-4">
                                <input type="text" {...register("fullName")} placeholder="Họ và tên" 
                                    className={`w-full border ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'} px-4 py-3 rounded focus:outline-none focus:border-blue-500 transition text-sm`} />
                                {errors.fullName && <span className="text-red-500 text-xs mt-1 block">{errors.fullName.message}</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="md:col-span-2">
                                     <input type="email" {...register("email")} placeholder="Email" 
                                        className={`w-full border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'} px-4 py-3 rounded focus:outline-none focus:border-blue-500 transition text-sm`} />
                                     {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
                                </div>
                                <div>
                                     <input type="text" {...register("phone")} placeholder="Điện thoại" 
                                        className={`w-full border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'} px-4 py-3 rounded focus:outline-none focus:border-blue-500 transition text-sm`} />
                                     {errors.phone && <span className="text-red-500 text-xs mt-1 block">{errors.phone.message}</span>}
                                </div>
                            </div>

                            <div className="mb-4">
                                <input type="text" {...register("address")} placeholder="Số nhà, tên đường..." 
                                    className={`w-full border ${errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'} px-4 py-3 rounded focus:outline-none focus:border-blue-500 transition text-sm`} />
                                {errors.address && <span className="text-red-500 text-xs mt-1 block">{errors.address.message}</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {/* Tỉnh/Thành */}
                                <div>
                                    <select 
                                        {...register("province")} 
                                        className={`w-full border ${errors.province ? 'border-red-500' : 'border-gray-300'} px-4 py-3 rounded focus:outline-none focus:border-blue-500 text-sm cursor-pointer bg-white appearance-none`}
                                    >
                                        <option value="">Tỉnh / Thành</option>
                                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                     {errors.province && <span className="text-red-500 text-xs mt-1 block">{errors.province.message}</span>}
                                </div>

                                {/* Quận/Huyện */}
                                <div>
                                     <select 
                                        {...register("district")} 
                                        disabled={!selectedProvince} 
                                        className={`w-full border ${errors.district ? 'border-red-500' : 'border-gray-300'} px-4 py-3 rounded focus:outline-none focus:border-blue-500 text-sm cursor-pointer bg-white appearance-none disabled:bg-gray-100`}
                                     >
                                        <option value="">Quận / Huyện</option>
                                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                    {errors.district && <span className="text-red-500 text-xs mt-1 block">{errors.district.message}</span>}
                                </div>

                                {/* Phường/Xã */}
                                <div>
                                     <select 
                                        {...register("ward")} 
                                        disabled={!selectedDistrict} 
                                        className={`w-full border ${errors.ward ? 'border-red-500' : 'border-gray-300'} px-4 py-3 rounded focus:outline-none focus:border-blue-500 text-sm cursor-pointer bg-white appearance-none disabled:bg-gray-100`}
                                     >
                                        <option value="">Phường / Xã</option>
                                        {wards.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                    </select>
                                     {errors.ward && <span className="text-red-500 text-xs mt-1 block">{errors.ward.message}</span>}
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <textarea {...register("note")} placeholder="Ghi chú thêm (Tùy chọn)" rows={3}
                                    className="w-full border border-gray-300 px-4 py-3 rounded focus:outline-none focus:border-blue-500 transition text-sm resize-none" />
                            </div>
                        </div>

                         {/* === STEP 2 === */}
                         <div className={currentStep === 2 ? 'block' : 'hidden'}>
                            <div className="mb-8">
                                <h3 className="text-lg font-bold mb-4">Phương thức vận chuyển</h3>
                                <div className="border border-gray-200 rounded p-4 flex justify-between items-center bg-white">
                                    <div className="flex items-center gap-3">
                                        <Truck className="text-blue-600" size={24} />
                                        <span className="text-sm">Giao hàng tận nơi (phí vận chuyển tạm tính)</span>
                                    </div>
                                    <span className="font-bold text-sm">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(30000)}</span>
                                </div>
                            </div>
                            
                            <div className="mb-8">
                                <h3 className="text-lg font-bold mb-4">Phương thức thanh toán</h3>
                                <div className="border border-gray-200 rounded bg-white overflow-hidden">
                                    <label className={`flex items-center gap-4 p-4 border-b cursor-pointer transition ${selectedPayment === 'momo' ? 'bg-blue-50' : ''}`}>
                                        <input type="radio" value="momo" {...register('paymentMethod')} className="accent-blue-600 w-5 h-5" />
                                        <div className="w-10 h-10 relative border rounded flex items-center justify-center bg-pink-600 text-white font-bold text-xs">MoMo</div>
                                        <span className="text-sm font-medium">Ví MoMo</span>
                                    </label>
                                    <label className={`flex items-center gap-4 p-4 border-b cursor-pointer transition ${selectedPayment === 'card' ? 'bg-blue-50' : ''}`}>
                                        <input type="radio" value="card" {...register('paymentMethod')} className="accent-blue-600 w-5 h-5" />
                                        <CreditCard className="text-blue-900" size={32} />
                                        <span className="text-sm font-medium">Thẻ ATM/ Visa/ Master/ JCB</span>
                                    </label>
                                    <label className={`flex items-center gap-4 p-4 cursor-pointer transition ${selectedPayment === 'bank' ? 'bg-blue-50' : ''}`}>
                                        <input type="radio" value="bank" {...register('paymentMethod')} className="accent-blue-600 w-5 h-5" />
                                        <div className="w-10 h-10 relative border rounded flex items-center justify-center bg-gray-100 text-gray-600 font-bold text-xs">Bank</div>
                                        <span className="text-sm font-medium">Chuyển khoản qua ngân hàng</span>
                                    </label>
                                </div>
                            </div>
                         </div>

                        <div className="flex items-center justify-between mt-8">
                            <Link href="/cart" className="text-blue-600 hover:underline text-sm">
                                ← Giỏ hàng
                            </Link>
                            <button 
                                type="submit"
                                disabled={isProcessing}
                                className="bg-blue-600 text-white px-6 py-4 rounded font-bold uppercase hover:bg-blue-700 transition text-sm disabled:opacity-70 flex items-center gap-2"
                            >
                                {isProcessing && <Loader2 className="animate-spin" size={16} />}
                                {isProcessing ? "Đang xử lý..." : (currentStep === 1 ? "Phương thức thanh toán" : "Đặt hàng")}
                            </button>
                        </div>
                    </form>
                </div>

                {/* --- RIGHT COLUMN: ORDER SUMMARY --- */}
                <div className="lg:col-span-2 order-1 lg:order-2 mb-8 lg:mb-0">
                    <div className="bg-white p-6 shadow-sm border border-gray-100 rounded sticky top-8">
                        <h3 className="text-lg font-bold mb-6 pb-4 border-b">Đơn hàng ({items.length} sản phẩm)</h3>
                        
                        <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 mb-6 scrollbar-thin">
                            {items.map(item => (
                                <div key={`${item.id}-${item.size}-${item.color}`} className="flex gap-4 items-start">
                                    <div className="relative w-16 h-20 border bg-gray-50 rounded overflow-hidden flex-shrink-0">
                                        <Image 
                                            src={item.image} 
                                            alt={item.name} 
                                            fill 
                                            className="object-cover" 
                                        />
                                         <span className="absolute top-0 right-0 bg-gray-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full -mt-2 -mr-2 font-bold">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.name}</h4>
                                        <p className="text-xs text-gray-500">{item.size} / {item.color}</p>
                                    </div>
                                    <div className="text-sm font-bold text-gray-900">
                                         {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4 space-y-4">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Tạm tính:</span>
                                <span className="font-medium">
                                     {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Phí vận chuyển:</span>
                                <span className="font-medium">
                                    {shippingFee === 0 ? '---' : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(shippingFee)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-gray-900 border-t pt-4">
                                <span>Tổng tiền:</span>
                                <span className="text-blue-600">
                                     {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalPrice + shippingFee)}
                                </span>
                            </div>
                             {currentStep === 1 && (
                                <p className="text-xs text-gray-500 text-right mt-1 font-normal">
                                    (Phí vận chuyển sẽ được tính ở bước tiếp theo)
                                </p>
                            )}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}