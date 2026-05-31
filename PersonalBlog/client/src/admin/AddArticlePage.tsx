import { useParams, Link, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

function AddArticlePage() {
  const { adminId } = useParams<{ adminId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Local state quản lý dữ liệu form mới
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');

  // Khai báo Mutation để xử lý hành động POST bài viết mới lên Server
  const addMutation = useMutation({
    mutationFn: async (newArticle: { title: string; content: string }) => {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không thể tạo bài viết mới.");
      }
      return res.json();
    },
    onSuccess: () => {
      alert("Tạo bài viết mới thành công!");
      
      // Xóa cache cũ để trang Dashboard và HomePage cập nhật bài viết mới ngay lập tức
      queryClient.invalidateQueries({ queryKey: ['adminArticles', adminId] });
      queryClient.invalidateQueries({ queryKey: ['publicArticles'] });
      
      // Chuyển hướng về Dashboard
      navigate(`/${adminId}/dashboard`);
    },
    onError: (err: any) => {
      alert(err.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("Vui lòng điền đầy đủ tiêu đề và nội dung.");
      return;
    }
    // Gửi data lên server
    addMutation.mutate({ title, content });
  };

  return (
    <div className="w-full min-h-[500px] p-8 bg-white rounded-xl shadow-sm border border-gray-200">
      
      {/* Header trang tạo mới */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Tạo bài viết mới
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
            placeholder="Nhập tiêu đề bài viết tại đây..."
            disabled={addMutation.isPending}
          />
        </div>

        {/* Input Nội dung văn bản (Textarea) */}
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
            placeholder="Bắt đầu viết nội dung bài viết của bạn..."
            disabled={addMutation.isPending}
          />
        </div>

        {/* Cụm nút hành động */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={addMutation.isPending}
            className={`px-6 py-3 font-bold text-white text-base rounded-lg shadow transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              addMutation.isPending 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {addMutation.isPending ? 'Đang tạo bài viết...' : 'Xuất bản bài viết'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddArticlePage;