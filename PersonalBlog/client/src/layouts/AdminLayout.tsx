import { useQuery, useQueryClient } from "@tanstack/react-query"; 
import { useParams, Navigate, Outlet, useNavigate, Link } from "react-router"; // Import thêm Link

export function AdminLayout() {
  const { adminId } = useParams<{ adminId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); 

  // Gọi API check session toàn cục cho phân hệ Admin
  const { data: authData, isLoading } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error("Chưa đăng nhập");
      return res.json(); 
    },
    retry: false,
    staleTime: 60 * 1000, 
  });

  // Hàm xử lý đăng xuất chuẩn production
  const handleLogout = async () => {
    if (!confirm("Bạn có chắc chắn muốn đăng xuất?")) return;

    try {
      const res = await fetch('/api/logout', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        // Xóa sạch toàn bộ cache khi logout
        queryClient.clear();
        
        // Sút về màn home và xóa stack lịch sử
        navigate('/home', { replace: true });
      } else {
        alert("Đăng xuất thất bại từ phía máy chủ.");
      }
    } catch (err) {
      console.error("Logout Error:", err);
      alert("Không thể kết nối đến máy chủ để đăng xuất.");
    }
  };

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center text-gray-600 font-medium">Đang kiểm tra quyền truy cập...</div>;
  }

  // PHÒNG VỆ: Nếu không có adminId trên URL HOẶC session server không khớp với ID trên URL
  if (!adminId || !authData || authData.adminId.toString() !== adminId.toString()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Thanh Header */}
      <header className="p-4 bg-gray-800 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-lg text-blue-400">Hệ thống Admin</span>
          <span className="text-gray-500">|</span>
          <span className="text-sm font-medium text-gray-300">
            Xin chào, <strong className="text-white font-semibold">{authData.username}</strong>
          </span>
          <span className="text-gray-500">|</span>
          
          {/* NÚT QUAY LẠI TRANG CHỦ PUBLIC */}
          <Link 
            to="/home"
            className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            &larr; Về trang chủ
          </Link>
        </div>

        {/* Nút Đăng xuất */}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-bold rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        >
          Đăng xuất
        </button>
      </header>
      
      {/* Vùng hiển thị nội dung các trang con rộng rãi */}
      <main className="p-8 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}