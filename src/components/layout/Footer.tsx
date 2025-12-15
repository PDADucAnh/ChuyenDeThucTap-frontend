import Link from 'next/link';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <div>
      
      {/* --- PHẦN 1: NEWSLETTER (Đã chỉnh chiều cao ngắn lại) --- */}
      <section className="bg-gray-100 py-10"> {/* Sửa py-20 thành py-10 */}
        <div className="container mx-auto px-4 text-center max-w-xl"> {/* Giảm max-w để nội dung gom gọn hơn */}
          
          <h2 className="text-2xl font-bold uppercase mb-2 text-black">Đăng ký bản tin</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Đăng ký nhận bản tin PDA để được cập nhật những mẫu thiết kế mới nhất
          </p>

          <form className="flex flex-col sm:flex-row gap-3 mb-6"> {/* Giảm gap và thêm mb */}
            <input
              type="email"
              placeholder="Nhập email của bạn..."
              className="flex-1 bg-white border border-gray-300 px-4 py-2 text-sm text-black focus:outline-none focus:border-black"
            />
            <button
              type="button"
              className="bg-black text-white px-6 py-2 text-sm font-bold uppercase hover:bg-gray-800 transition"
            >
              Đăng ký
            </button>
          </form>

          {/* Social Icons (Đã giảm margin top) */}
          <div className="flex justify-center gap-4">
            <Link href="#" className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:opacity-90 transition">
              <Facebook size={16} />
            </Link>
            <Link href="#" className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center hover:opacity-90 transition">
              <Instagram size={16} />
            </Link>
            <Link href="#" className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:opacity-90 transition">
              <Youtube size={16} />
            </Link>
          </div>

        </div>
      </section>

      {/* --- PHẦN 2: FOOTER CHÍNH (Giữ nguyên) --- */}
      <footer className="bg-black text-white pt-12 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 border-b border-gray-800 pb-8">
            
            {/* Cột 1 */}
            <div>
              <h4 className="text-base font-bold uppercase mb-4">PDA FASHION</h4>
              <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                Thương hiệu thời trang công sở hàng đầu, mang lại vẻ đẹp sang trọng và thanh lịch.
              </p>
              <div className="space-y-2 text-xs text-gray-400">
                <p className="flex items-center gap-2"><MapPin size={14} /> 123 Đường ABC, TP.HCM</p>
                <p className="flex items-center gap-2"><Phone size={14} /> 1900 xxxx</p>
                <p className="flex items-center gap-2"><Mail size={14} /> support@pda.com</p>
              </div>
            </div>

            {/* Cột 2 */}
            <div>
              <h4 className="text-sm font-bold uppercase mb-4">Giới thiệu</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Về PDA Fashion</Link></li>
                <li><Link href="#" className="hover:text-white transition">Tuyển dụng</Link></li>
                <li><Link href="#" className="hover:text-white transition">Hệ thống cửa hàng</Link></li>
              </ul>
            </div>

            {/* Cột 3 */}
            <div>
              <h4 className="text-sm font-bold uppercase mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-xs text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Chính sách vận chuyển</Link></li>
                <li><Link href="#" className="hover:text-white transition">Chính sách đổi trả</Link></li>
                <li><Link href="#" className="hover:text-white transition">Hướng dẫn chọn size</Link></li>
              </ul>
            </div>

            {/* Cột 4 */}
            <div>
              <h4 className="text-sm font-bold uppercase mb-4">Kết nối</h4>
              <div className="flex gap-3 mb-4">
                <Link href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition"><Facebook size={16}/></Link>
                <Link href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition"><Instagram size={16}/></Link>
                <Link href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition"><Youtube size={16}/></Link>
              </div>
              <h4 className="text-xs font-bold uppercase mb-2">Thanh toán</h4>
              <div className="flex gap-2">
                <div className="bg-white text-black px-2 py-1 text-[10px] font-bold rounded">VISA</div>
                <div className="bg-white text-black px-2 py-1 text-[10px] font-bold rounded">MOMO</div>
              </div>
            </div>
            
          </div>

          <div className="text-center text-gray-600 text-xs">
            © 2025 PDA FASHION. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}