'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '@/services/auth.service';
import { AxiosError } from 'axios'; // Import AxiosError

// Định nghĩa cấu trúc lỗi trả về từ Backend
interface RegisterErrorResponse {
    message?: string;
    errors?: {
        email?: string[];
        phone?: string[];
        [key: string]: string[] | undefined;
    };
}

const registerSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập họ tên"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
        await authService.register(data);
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        router.push('/login');
    } catch (error) {
        // --- SỬA LỖI: Xử lý hiển thị lỗi chi tiết ---
        const err = error as AxiosError<RegisterErrorResponse>;
        console.error("Chi tiết lỗi đăng ký:", err);

        if (err.response && err.response.data) {
            const data = err.response.data;
            // Trường hợp Laravel trả về lỗi validation trong object `errors`
            if (data.errors) {
                if (data.errors.email) alert(data.errors.email[0]);
                else if (data.errors.phone) alert(data.errors.phone[0]);
                else alert("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.");
            } else if (data.message) {
                alert(data.message);
            } else {
                alert("Đăng ký thất bại.");
            }
        } else if (err.request) {
             alert("Không thể kết nối đến Server (Network Error). Hãy kiểm tra lại Backend.");
        } else {
             alert("Có lỗi xảy ra: " + err.message);
        }
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-lg">
        <h1 className="text-2xl font-bold uppercase mb-2 text-center tracking-wide text-gray-900">Đăng ký tài khoản</h1>
        <p className="text-sm text-gray-500 mb-8 text-center">
            Đã có tài khoản? <Link href="/login" className="text-black underline">Đăng nhập tại đây</Link>
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            
            {/* Họ tên */}
            <div>
                <input 
                    {...register("name")}
                    type="text" 
                    placeholder="Họ và tên" 
                    className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-black text-sm"
                />
                {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
            </div>

            {/* Email */}
            <div>
                <input 
                    {...register("email")}
                    type="email" 
                    placeholder="Email" 
                    className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-black text-sm"
                />
                {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
            </div>

            {/* Số điện thoại */}
            <div>
                <input 
                    {...register("phone")}
                    type="text" 
                    placeholder="Số điện thoại" 
                    className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-black text-sm"
                />
                {errors.phone && <span className="text-red-500 text-xs mt-1 block">{errors.phone.message}</span>}
            </div>

            {/* Mật khẩu */}
            <div>
                <input 
                    {...register("password")}
                    type="password" 
                    placeholder="Mật khẩu" 
                    className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-black text-sm"
                />
                {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password.message}</span>}
            </div>

            {/* Nút Đăng ký */}
            <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-black text-white w-full py-4 mt-4 text-sm font-bold uppercase hover:bg-gray-800 transition disabled:opacity-70"
            >
                {isSubmitting ? "Đang xử lý..." : "Đăng ký"}
            </button>
            
            <div className="text-center mt-4">
                <Link href="/" className="text-xs text-gray-500 hover:text-black flex items-center justify-center gap-1">
                     ← Quay lại trang chủ
                </Link>
            </div>
        </form>
    </div>
  );
}