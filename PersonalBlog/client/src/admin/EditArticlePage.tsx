import { useParams, Link, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface Article {
  id: string | number;
  author: string;
  author_id: string;
  created_at: string;
  last_edited: string;
  title: string;
  content: string;
}

function EditArticlePage() {
  const { adminId, articleId } = useParams<{ adminId: string; articleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Local state quản lý dữ liệu trong form (Controlled Inputs)
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');

  // Fetch chi tiết bài viết cũ về
  const { data: article, isLoading, isError, error } = useQuery({
    queryKey: ['articleDetail', articleId],
    queryFn: async (): Promise<Article> => {
      if (!articleId) throw new Error("Id bài viết không hợp lệ.");
      const res = await fetch(`/api/articles/${articleId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Bài viết này không tồn tại.");
        throw new Error("Có lỗi xảy ra từ phía máy chủ.");
      }
      return res.json();
    },
    enabled: !!articleId,
  });

  // Đổ dữ liệu từ cache vào Form State khi tải xong
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
    }
  }, [article]);

  // Khai báo Mutation để xử lý hành động cập nhật (Gửi lên Server)
  const updateMutation = useMutation({
    mutationFn: async (updatedData: { title: string; content: string }) => {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT', // Hoặc 'PATCH' tùy cấu hình API của bạn
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Cập nhật bài viết thất bại.");
      }
      return res.json();
    },
    onSuccess: () => {
      alert("Cập nhật bài viết thành công!");
      // Tối quan trọng: Xóa cache cũ để các trang khác (Dashboard, HomePage) tự động nạp lại data mới
      queryClient.invalidateQueries({ queryKey: ['adminArticles', adminId] });
      queryClient.invalidateQueries({ queryKey: ['articleDetail', articleId] });
      queryClient.invalidateQueries({ queryKey: ['publicArticles'] });
      
      // Chuyển hướng mượt mà về lại trang quản lý chính
      navigate(`/${adminId}/dashboard`);
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }
    // Kích hoạt gửi API
    updateMutation.mutate({ title, content });
  };

  // 4. Các tầng bảo vệ xử lý giao diện sớm (Early Return)
  if (isLoading) return <div className="p-8 text-gray-600 font-medium">Đang tải bài viết...</div>;
  if (isError) return <div className="p-8 text-red-600 font-medium">{error.message}</div>;

  // PHÒNG VỆ: Kiểm tra quyền sở hữu bài viết AN TOÀN sau khi đã load xong dữ liệu
  if (article && article.author_id.toString() !== adminId?.toString()) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
        <p className="text-red-600 font-bold text-lg mb-4">Lỗi bảo mật: Bạn không có quyền chỉnh sửa bài viết này.</p>
        <Link to={`/${adminId}/dashboard`} className="text-blue-600 font-semibold hover:underline">&larr; Quay về Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-125 p-8 bg-white rounded-xl shadow-sm border border-gray-200">
      
      {/* Tiêu đề trang */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Cập nhật bài viết
        </h1>
        <Link 
          to={`/${adminId}/dashboard`} 
          className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          &larr; Hủy bỏ & Quay lại
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Tiêu đề */}
        <div>
          <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="title">
            Tiêu đề bài viết
          </label>
          <input 
            id="title"
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 font-bold text-xl rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow"
            placeholder="Nhập tiêu đề mới..."
          />
        </div>

        {/* Thông tin Meta dữ liệu (Chỉ đọc) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm font-medium text-gray-500">
          <div>
            Ngày đăng ban đầu: <span className="text-gray-800 font-semibold">{article?.created_at}</span>
          </div>
          {article?.last_edited && (
            <div>
              Chỉnh sửa lần cuối: <span className="text-gray-800 font-semibold">{article.last_edited}</span>
            </div>
          )}
        </div>

        {/* Input Nội dung văn bản (Textarea rộng rãi) */}
        <div>
          <label className="block mb-2 text-sm font-bold text-gray-700" htmlFor="content">
            Nội dung chi tiết
          </label>
          <textarea 
            id="content"
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 border border-gray-300 text-base rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow leading-relaxed"
            placeholder="Viết nội dung bài viết vào đây..."
          />
        </div>

        {/* Nút bấm hành động */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className={`px-6 py-3 font-bold text-white text-base rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              updateMutation.isPending 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {updateMutation.isPending ? 'Đang lưu thay đổi...' : 'Cập nhật bài viết'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditArticlePage;