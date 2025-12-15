'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '@/services/auth.service';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ").min(1, "Vui lòng nhập email"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

type LoginForm = z.infer<typeof loginSchema>;

interface AuthErrorResponse {
    error?: string;
    message?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const setAuthUser = useAuthStore((state) => state.login);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setErrorMsg('');
    try {
        const res = await authService.login(data);
        
        if (res.user) {
            setAuthUser(res.user);
        }

        // --- CẬP NHẬT LOGIC CHUYỂN HƯỚNG ---
        // Kiểm tra role của user trả về từ API
        if (res.user.roles === 'admin') {
            alert("Xin chào Admin!");
            router.push('/admin/dashboard'); // Chuyển hướng vào trang quản trị
        } else {
            alert("Đăng nhập thành công!");
            router.push('/profile'); // Khách hàng thì vào trang cá nhân
        }
        
    } catch (error) {
        const err = error as AxiosError<AuthErrorResponse>;
        console.error("Chi tiết lỗi:", err);

        if (err.response) {
            const serverData = err.response.data;
            if (serverData && serverData.error) {
                setErrorMsg(serverData.error);
            } else if (serverData && serverData.message) {
                setErrorMsg(serverData.message);
            } else {
                setErrorMsg(`Lỗi server (${err.response.status}): Vui lòng thử lại.`);
            }
        } else if (err.request) {
            setErrorMsg("Không thể kết nối đến Server. Vui lòng kiểm tra đường truyền hoặc Server Backend.");
        } else {
            setErrorMsg(err.message || "Có lỗi xảy ra.");
        }
    }
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        
        {/* CỘT TRÁI: FORM ĐĂNG NHẬP */}
        <div>
            <h1 className="text-2xl font-bold uppercase mb-6 tracking-wide text-gray-900">Đăng nhập</h1>
            
            {/* Hiển thị thông báo lỗi */}
            {errorMsg && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">
                    <strong className="font-bold">Lỗi: </strong>
                    <span className="block sm:inline">{errorMsg}</span>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {/* Email */}
                <div>
                    <input 
                        {...register("email")}
                        type="email" 
                        placeholder="Email" 
                        className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-black transition text-sm"
                    />
                    {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
                </div>

                {/* Password */}
                <div>
                    <input 
                        {...register("password")}
                        type="password" 
                        placeholder="Mật khẩu" 
                        className="w-full border border-gray-300 px-4 py-3 focus:outline-none focus:border-black transition text-sm"
                    />
                    {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password.message}</span>}
                </div>

                {/* Nút Submit */}
                <div className="flex items-center gap-4 mt-2">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-black text-white px-8 py-3 text-sm font-bold uppercase hover:bg-gray-800 transition disabled:opacity-70"
                    >
                        {isSubmitting ? "Đang xử lý..." : "Đăng nhập"}
                    </button>
                    <Link href="#" className="text-sm text-gray-500 hover:text-black underline">
                        Quên mật khẩu?
                    </Link>
                </div>
            </form>
            
            {/* Social Login */}
            <div className="mt-8 pt-8 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-4 text-center">Hoặc đăng nhập bằng</p>
                <div className="flex gap-4 justify-center">
                    <button className="bg-[#3b5998] text-white px-4 py-2 text-xs font-bold uppercase rounded flex items-center gap-2">Facebook</button>
                    <button className="bg-[#db4437] text-white px-4 py-2 text-xs font-bold uppercase rounded flex items-center gap-2">Google</button>
                </div>
            </div>
        </div>

        {/* CỘT PHẢI: KHÁCH HÀNG MỚI */}
        <div className="bg-gray-50 p-8 h-fit">
            <h2 className="text-xl font-bold uppercase mb-4 tracking-wide text-gray-900">Khách hàng mới</h2>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Đăng ký tài khoản để mua hàng nhanh hơn, cập nhật tình trạng đơn hàng và theo dõi các đơn hàng đã đặt.
            </p>
            <Link 
                href="/register" 
                className="inline-block bg-white border border-black text-black px-8 py-3 text-sm font-bold uppercase hover:bg-black hover:text-white transition"
            >
                Đăng ký ngay
            </Link>
        </div>

      </div>
    </div>
  );
}