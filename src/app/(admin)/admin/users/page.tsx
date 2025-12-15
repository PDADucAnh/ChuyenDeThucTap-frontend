'use client';

import { useEffect, useState } from 'react';
import { userService, User, UserPayload } from '@/services/user.service';
// FIX 1: Removed unused 'Search' import
import { Plus, Edit, Trash2, X, UserCheck, Shield } from 'lucide-react';
import { AxiosError } from 'axios';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form State
    // FIX 2: Explicitly type the state to match UserPayload's role type
    const [formData, setFormData] = useState<{
        name: string;
        email: string;
        phone: string;
        password?: string;
        roles: 'admin' | 'customer';
    }>({
        name: '',
        email: '',
        phone: '',
        password: '',
        roles: 'customer'
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await userService.getUsers();
            if (res.status) {
                // Laravel paginate trả về data bọc trong data: { data: [], ... }
                setUsers(res.data.data); 
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(), 0);
        return () => clearTimeout(timer);
    }, []);

    // Mở form thêm mới
    const handleCreate = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', phone: '', password: '', roles: 'customer' });
        setShowForm(true);
    };

    // Mở form sửa
    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone,
            password: '', // Không điền password cũ
            roles: user.roles
        });
        setShowForm(true);
    };

    // Submit Form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // FIX 3: Ensure formData matches Partial<UserPayload>
                await userService.updateUser(editingUser.id, formData);
                alert("Cập nhật thành công!");
            } else {
                // FIX 4: Ensure formData matches UserPayload. 'password' might be empty string but create expects it?
                // Adjusting logic to ensure password is sent if creating.
                // Assuming backend validation handles empty password if not required or we send it.
                // Cast to UserPayload to satisfy strict typing if necessary, though state typing should handle it.
                await userService.createUser(formData as UserPayload);
                alert("Thêm thành công!");
            }
            setShowForm(false);
            fetchUsers();
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    // Xóa User
    const handleDelete = async (id: number) => {
        if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;
        try {
            await userService.deleteUser(id);
            alert("Đã xóa!");
            fetchUsers();
        } catch (error) {
            const err = error as AxiosError<{ message: string }>;
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý khách hàng</h1>
                <button 
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 transition"
                >
                    <Plus size={18} /> Thêm thành viên
                </button>
            </div>

            {/* MODAL FORM */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">
                                {editingUser ? 'Cập nhật thông tin' : 'Thêm thành viên mới'}
                            </h3>
                            <button onClick={() => setShowForm(false)}><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Họ tên</label>
                                <input type="text" className="w-full border p-2 rounded" required
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input type="email" className="w-full border p-2 rounded" required
                                        value={formData.email}
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                                    <input type="text" className="w-full border p-2 rounded" required
                                        value={formData.phone}
                                        onChange={e => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Vai trò</label>
                                    <select className="w-full border p-2 rounded" 
                                        value={formData.roles}
                                        // FIX 5: Cast the event value to the specific union type
                                        onChange={e => setFormData({...formData, roles: e.target.value as 'admin' | 'customer'})}
                                    >
                                        <option value="customer">Khách hàng</option>
                                        <option value="admin">Quản trị viên</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Mật khẩu {editingUser && '(Để trống nếu ko đổi)'}</label>
                                    <input type="password" className="w-full border p-2 rounded"
                                        required={!editingUser} // Bắt buộc nếu là thêm mới
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="pt-2 flex gap-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Lưu lại</button>
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Hủy</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TABLE */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Họ tên</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">SĐT</th>
                            <th className="px-6 py-4">Vai trò</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {loading ? (
                            <tr><td colSpan={6} className="text-center py-8">Đang tải...</td></tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">#{user.id}</td>
                                <td className="px-6 py-4 font-bold text-gray-800">{user.name}</td>
                                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                <td className="px-6 py-4">{user.phone}</td>
                                <td className="px-6 py-4">
                                    {user.roles === 'admin' ? (
                                        <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold w-fit">
                                            <Shield size={12}/> Quản trị
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold w-fit">
                                            <UserCheck size={12}/> Khách hàng
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button onClick={() => handleEdit(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Sửa">
                                        <Edit size={18}/>
                                    </button>
                                    <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Xóa">
                                        <Trash2 size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}