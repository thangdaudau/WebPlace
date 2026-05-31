import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

interface Article {
  id: string | number;
  author: string;
  last_edited: string; 
  title: string;
}

function HomePage() {
  // 1. Fetch danh sách bài viết công khai
  const { data: articles, isLoading, isError } = useQuery({
    queryKey: ['publicArticles'],
    queryFn: async (): Promise<Article[]> => {
      const res = await fetch('/api/articles');
      if (!res.ok) {
        throw new Error("Không thể tải danh sách bài viết.");
      }
      return res.json();
    },
    staleTime: 30 * 1000, 
  });

  // 2. CHECK SESSION NGẦM: Kiểm tra xem user hiện tại đã đăng nhập chưa
  const { data: authData } = useQuery({
    queryKey: ['authMe'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null; // Thất bại coi như chưa đăng nhập, không throw error làm sập UI
      return res.json(); // Trả về { authenticated: true, adminId: '...', username: '...' }
    },
    retry: false,
    staleTime: 60 * 1000, // Tận dụng cache chung 1 phút với hệ thống
  });

  if (isLoading) return <div className="p-8 text-gray-600 font-medium">Đang tải dữ liệu...</div>;
  if (isError) return <div className="p-8 text-red-600 font-medium">Không thể kết nối đến máy chủ.</div>;

  return (
    <div className="w-full min-h-125 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
      
      {/* Header Wrapper */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Danh sách bài viết
        </h1>
        
        {/* XỬ LÝ ĐỔI NÚT ĐỘNG DỰA TRÊN TRẠNG THÁI ĐĂNG NHẬP */}
        {authData && authData.authenticated && authData.adminId ? (
          <div className="flex items-center space-x-3">
            {/* Hiển thị câu chào nhỏ gọn bên cạnh nút */}
            <span className="text-sm text-gray-500 font-medium hidden sm:inline">
              Chào, <strong className="text-gray-700 font-bold">{authData.username}</strong>
            </span>
            <Link 
              to={`/${authData.adminId}/dashboard`} 
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-sm rounded-lg shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors flex items-center gap-1"
            >
              Vào trang Quản trị &rarr;
            </Link>
          </div>
        ) : (
          // Nếu chưa đăng nhập -> Giữ nguyên nút màu xanh dương cũ
          <Link 
            to="/login" 
            className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Đăng nhập Admin
          </Link>
        )}
      </div>

      {/* Danh sách bài viết */}
      {!articles || articles.length === 0 ? (
        <p className="text-gray-500 italic text-center py-8">Hiện chưa có bài viết nào.</p>
      ) : (
        <ul className="space-y-4">
          {articles.map(article => (
            <li key={article.id}>
              <Link 
                to={`/article/${article.id}`} 
                className="block p-5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
              >
                <span className="block text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                  {article.title}
                </span>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <span className="text-sm font-medium text-gray-500">
                    Tác giả: <span className="text-gray-700 font-semibold">{article.author}</span>
                  </span>
                  {article.last_edited && (
                    <span className="text-xs font-medium text-gray-400">
                      Cập nhật: {article.last_edited}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default HomePage;