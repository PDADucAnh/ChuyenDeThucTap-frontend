import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Lấy token và role từ cookie (đã lưu lúc login)
  const token = request.cookies.get('access_token')?.value;
  
  // Lưu ý: Lấy thông tin user từ cookie user_info (cần parse JSON)
  const userInfoCookie = request.cookies.get('user_info')?.value;
  let userRole = '';
  
  try {
      if (userInfoCookie) {
          const user = JSON.parse(userInfoCookie);
          userRole = user.roles;
      }
  } catch (e) {
      console.error("Lỗi parse cookie user", e);
  }

  const { pathname } = request.nextUrl;

  // 2. BẢO VỆ ROUTE ADMIN
  // Nếu đang cố vào trang bắt đầu bằng /admin
  if (pathname.startsWith('/admin')) {
      // Nếu chưa có token -> Đá về login
      if (!token) {
          return NextResponse.redirect(new URL('/login', request.url));
      }

      // Nếu có token nhưng không phải admin -> Đá về trang chủ (hoặc trang 403)
      if (userRole !== 'admin') {
          return NextResponse.redirect(new URL('/', request.url));
      }
  }

  // 3. BẢO VỆ ROUTE LOGIN/REGISTER
  // Nếu đã đăng nhập mà cố vào login -> Đá về trang tương ứng
  if ((pathname.startsWith('/login') || pathname.startsWith('/register')) && token) {
      if (userRole === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/profile', request.url));
  }

  return NextResponse.next();
}

// Cấu hình các route mà middleware sẽ chạy qua
export const config = {
  matcher: [
    '/admin/:path*', // Bắt tất cả route con của admin
    '/login',
    '/register'
  ],
};
