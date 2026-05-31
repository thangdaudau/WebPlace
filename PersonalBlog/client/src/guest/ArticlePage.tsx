import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';

interface Article {
  id: string | number;
  author: string;
  author_id: string;
  created_at: string;
  last_edited: string;
  title: string;
  content: string;
}

function ArticlePage() {
  const { id } = useParams<{ id: string }>(); 

  // 1. Thay thế useEffect bằng useQuery để đồng bộ hóa tầng dữ liệu
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['articleDetail', id],
    queryFn: async (): Promise<Article> => {
      if (!id) throw new Error("ID bài viết không hợp lệ.");
      
      const res = await fetch(`/api/articles/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Bài viết này không tồn tại hoặc đã bị xóa.");
        }
        throw new Error("Có lỗi xảy ra từ hệ thống phía máy chủ.");
      }
      return res.json();
    },
    enabled: !!id, // Chỉ chạy query khi có id trên URL
    staleTime: 60 * 1000, // Chi tiết bài viết ít khi đổi, cache 1 phút để tối ưu tốc độ
  });

  if (isLoading) return <div className="p-8 text-gray-600 font-medium">Đang tải bài viết...</div>;
  
  // 2. Render màn hình lỗi sạch sẽ nếu API tạch hoặc 404
  if (error) {
    return (
      <div className="w-full p-12 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
        <p className="text-red-600 font-bold text-lg mb-4">{error.message}</p>
        <Link to="/home" className="text-blue-600 font-semibold hover:underline">
          &larr; Quay về Trang chủ
        </Link>
      </div>
    );
  }

  if (!article) return <div className="p-8 text-gray-500 italic text-center">Dữ liệu trống.</div>;

  return (
    // Khung layout mở rộng, thoáng đạt đồng bộ với Dashboard và Homepage
    <div className="w-full min-h-125 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
      
      {/* Nút quay lại - Sửa thành đường dẫn tuyệt đối /home để tránh lỗi 404 */}
      <Link 
        to="/home" 
        className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-6 inline-flex items-center gap-1"
      >
        &larr; Quay lại danh sách
      </Link>
      
      {/* Tiêu đề lớn, đậm nét */}
      <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
        {article.title}
      </h1>
      
      {/* Metadata phân cách rõ ràng */}
      <div className="flex items-center text-sm font-medium text-gray-400 pb-6 border-b border-gray-300">
        <span>
          Tác giả: <strong className="text-gray-700 font-semibold">{article.author}</strong>
        </span>
        <span className="mx-3 text-gray-200">|</span>
        <span>Ngày xuất bản: {article.created_at}</span>
      </div>
      
      {/* Nội dung bài viết với khoảng cách dòng thoải mái, dễ đọc */}
      <div className="mt-8 text-lg text-gray-800 leading-relaxed whitespace-pre-wrap tracking-wide max-w-none">
        {article.content}
      </div>
    </div>
  );
}

export default ArticlePage;