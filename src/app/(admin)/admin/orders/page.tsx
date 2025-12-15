"use client";

import { useEffect, useState, useCallback } from "react";
// FIX 1: Removed unused 'Link'
import {
  Eye,
  Search,
  Filter,
  Trash2,
  X,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { orderService, Order } from "@/services/order.service";
import { AxiosError } from "axios";

// Helper: Màu sắc & Icon cho trạng thái đơn hàng
const getStatusBadge = (status: number) => {
  switch (status) {
    case 1:
      return (
        <span className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
          <AlertCircle size={12} /> Mới
        </span>
      );
    case 2:
      return (
        <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
          <CheckCircle size={12} /> Đã xác nhận
        </span>
      );
    case 3:
      return (
        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
          <Truck size={12} /> Đang giao
        </span>
      );
    case 4:
      return (
        <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">
          <CheckCircle size={12} /> Hoàn thành
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
          <XCircle size={12} /> Hủy
        </span>
      );
  }
};

// FIX 2: Add index signature to match OrderQueryParams in service
interface OrderParams {
  status?: number;
  keyword?: string;
  [key: string]: unknown; // Allow additional properties
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<number | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // State cho Modal Xem Chi Tiết
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // FIX 3: Wrap fetchOrders in useCallback to fix exhaustive-deps warning
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Chuẩn bị params
      const params: OrderParams = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (searchTerm) params.keyword = searchTerm;

      const res = await orderService.getOrders(params);
      console.log("Dữ liệu đơn hàng nhận được:", res);

      if (res.status) {
        setOrders(res.orders.data);
      }
    } catch (error) {
      console.error("Lỗi gọi API Order:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]); // Add dependencies

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // Add fetchOrders to dependency array

  // Xử lý tìm kiếm (Debounce đơn giản hoặc Enter)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  // Xóa đơn hàng
  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác."
      )
    )
      return;
    try {
      await orderService.deleteOrder(id);
      alert("Đã xóa đơn hàng!");
      fetchOrders();
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  // Mở modal xem chi tiết
  const handleViewDetail = async (id: number) => {
    try {
      const res = await orderService.getOrderById(id);
      if (res.status) {
        setSelectedOrder(res.order);
        setShowModal(true);
      }
    } catch (error) {
      console.error("Lỗi tải chi tiết:", error);
      alert("Không thể tải thông tin đơn hàng.");
    }
  };

  // Cập nhật trạng thái trong Modal
  const handleUpdateStatus = async (newStatus: number) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    try {
      await orderService.updateStatus(selectedOrder.id, newStatus);
      alert("Cập nhật trạng thái thành công!");

      // Cập nhật lại UI local
      setSelectedOrder({ ...selectedOrder, status: newStatus });
      fetchOrders(); // Reload danh sách nền
    } catch (error) {
      const err = error as AxiosError<{ message: string }>;
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Quản lý đơn hàng
      </h1>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <form
          onSubmit={handleSearch}
          className="relative flex-1 max-w-md w-full"
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Tìm kiếm mã đơn, tên, sđt..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-gray-500" />
          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="1">Mới</option>
            <option value="2">Đã xác nhận</option>
            <option value="3">Đang giao</option>
            <option value="4">Hoàn thành</option>
            <option value="5">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
              <tr>
                <th className="px-6 py-4">Mã đơn</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Ngày đặt</th>
                <th className="px-6 py-4">Tổng tiền</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-medium text-blue-600">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {order.name}
                      </div>
                      <div className="text-xs text-gray-500">{order.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(order.total_amount || 0)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetail(order.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa đơn hàng"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">
                Chi tiết đơn hàng #{selectedOrder.id}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-black"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Thông tin khách hàng */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3 border-b pb-1">
                    Thông tin khách hàng
                  </h4>
                  <div className="text-sm space-y-2">
                    <p>
                      <span className="text-gray-500">Họ tên:</span>{" "}
                      {selectedOrder.name}
                    </p>
                    <p>
                      <span className="text-gray-500">SĐT:</span>{" "}
                      {selectedOrder.phone}
                    </p>
                    <p>
                      <span className="text-gray-500">Email:</span>{" "}
                      {selectedOrder.email}
                    </p>
                    <p>
                      <span className="text-gray-500">Địa chỉ:</span>{" "}
                      {selectedOrder.address}
                    </p>
                    <p>
                      <span className="text-gray-500">Ghi chú:</span>{" "}
                      {selectedOrder.note || "Không có"}
                    </p>
                  </div>
                </div>

                {/* Trạng thái đơn hàng */}
                <div>
                  <h4 className="font-bold text-gray-700 mb-3 border-b pb-1">
                    Trạng thái đơn hàng
                  </h4>
                  <div className="mb-4">
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">
                      Cập nhật trạng thái:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {/* Logic hiển thị nút chuyển trạng thái tùy theo trạng thái hiện tại */}
                      {selectedOrder.status === 1 && (
                        <button
                          onClick={() => handleUpdateStatus(2)}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Xác nhận đơn
                        </button>
                      )}
                      {selectedOrder.status === 2 && (
                        <button
                          onClick={() => handleUpdateStatus(3)}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                        >
                          Giao hàng
                        </button>
                      )}
                      {selectedOrder.status === 3 && (
                        <button
                          onClick={() => handleUpdateStatus(4)}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Hoàn thành
                        </button>
                      )}
                      {selectedOrder.status < 4 && (
                        <button
                          onClick={() => handleUpdateStatus(5)}
                          disabled={updatingStatus}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Hủy đơn
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <h4 className="font-bold text-gray-700 mb-3 border-b pb-1">
                  Sản phẩm đã đặt
                </h4>
                <table className="w-full text-left text-sm border-collapse border border-gray-200">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="p-3 border border-gray-200">Sản phẩm</th>
                      <th className="p-3 border border-gray-200 text-center">
                        SL
                      </th>
                      <th className="p-3 border border-gray-200 text-right">
                        Đơn giá
                      </th>
                      <th className="p-3 border border-gray-200 text-right">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.order_details?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 border border-gray-200">
                          {item.product?.name ||
                            `Product ID: ${item.product_id}`}
                        </td>
                        <td className="p-3 border border-gray-200 text-center">
                          {item.qty}
                        </td>
                        <td className="p-3 border border-gray-200 text-right">
                          {new Intl.NumberFormat("vi-VN").format(item.price)}
                        </td>
                        <td className="p-3 border border-gray-200 text-right font-medium">
                          {new Intl.NumberFormat("vi-VN").format(item.amount)}
                        </td>
                      </tr>
                    ))}
                    {/* Tổng cộng */}
                    <tr className="bg-gray-50 font-bold">
                      <td
                        colSpan={3}
                        className="p-3 text-right border border-gray-200"
                      >
                        Tổng tiền:
                      </td>
                      <td className="p-3 text-right border border-gray-200 text-red-600 text-base">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(selectedOrder.total_amount || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
