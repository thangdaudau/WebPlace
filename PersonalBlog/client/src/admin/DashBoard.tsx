import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; 
import { useParams, Link, useNavigate } from "react-router"; // Import thêm useNavigate

interface Article {
  id: string | number;
  title: string;
}

function DashBoard() {
  const { adminId } = useParams<{ adminId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Hook dùng để chuyển hướng trang

  // 1. Fetch danh sách bài viết quản trị
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminArticles', adminId],
    queryFn: async (): Promise<Article[]> => {
      const res = await fetch(`/api/${adminId}/dashboard`);
      if (!res.ok) {
        // Nếu Server trả về 401 hoặc 403 -> Đá bay về login lập tức
        if (res.status === 401 || res.status === 403) {
          queryClient.clear(); // Xóa sạch dữ liệu bộ nhớ tạm tránh leak data
          navigate('/login', { replace: true });
          throw new Error("Phiên làm việc hết hạn.");
        }
        
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể tải danh sách bài viết");
      }
      return res.json();
    }
  });

  // 2. KHAI BÁO MUTATION: Xử lý hành động xóa bài viết
  const deleteMutation = useMutation({
    mutationFn: async (articleId: string | number) => {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        // Đang bấm Delete mà hết session giữa chừng -> Cũng sút về login luôn
        if (res.status === 401 || res.status === 403) {
          queryClient.clear();
          navigate('/login', { replace: true });
          throw new Error("Phiên làm việc hết hạn.");
        }
        
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Xóa bài viết thất bại.");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminArticles', adminId] });
      queryClient.invalidateQueries({ queryKey: ['publicArticles'] });
    },
    onError: (err: any) => {
      // Chỉ alert lỗi nếu không phải lỗi hết phiên (vì lỗi hết phiên đã bị navigate đi rồi)
      if (err.message !== "Phiên làm việc hết hạn.") {
        alert(err.message);
      }
    }
  });

  const handleDelete = (articleId: string | number, articleTitle: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa bài viết "${articleTitle}"?`)) {
      deleteMutation.mutate(articleId);
    }
  };

  if (isLoading) return <div className="p-6 text-gray-600 font-medium">Đang tải dữ liệu...</div>;
  if (isError) return <div className="p-6 text-red-600 font-medium">{error.message}</div>;

  return (
    <div className="w-full min-h-125 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
      
      {/* Header: Title và Nút Add */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Personal Blog
        </h1>
        <Link 
          to={`/${adminId}/new`} 
          className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
        >
          + Add
        </Link>
      </div>

      {/* Danh sách bài viết */}
      <div>
        <ul className="space-y-4">
          {data?.map(article => (
            <li 
              key={article.id} 
              className="flex w-full items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50/50 transition-colors"
            >
              <span className="text-lg font-bold text-gray-800 truncate max-w-[60%]">
                {article.title}
              </span>

              <div className="flex items-center space-x-4 shrink-0">
                <Link 
                  to={`/${adminId}/edit/${article.id}`}
                  className="text-lg font-bold text-slate-400 hover:text-blue-500 transition-colors"
                >
                  Edit
                </Link>
                <button 
                  onClick={() => handleDelete(article.id, article.title)}
                  // Chống spam click và sửa lỗi đồng loạt nhảy chữ Deleting ở câu trước
                  disabled={deleteMutation.isPending && deleteMutation.variables === article.id}
                  className={`text-lg font-bold transition-colors ${
                    deleteMutation.isPending && deleteMutation.variables === article.id
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-slate-400 hover:text-red-500'
                  }`}
                >
                  {deleteMutation.isPending && deleteMutation.variables === article.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </li>
          ))}

          {data?.length === 0 && (
            <p className="text-gray-500 italic text-center py-4">Chưa có bài viết nào.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default DashBoard;