import { useEffect, useState } from 'react';
import { Link } from 'react-router';

function HomePage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/articles')
            .then(res => res.json())
            .then(data => {
                setArticles(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Lỗi fetch articles:", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Đang tải dữ liệu...</div>;

    return (
        <div className="p-4">
            {/* Header Wrapper: Đảm bảo khoảng cách và căn thẳng hàng giữa chữ và nút */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Danh sách bài viết</h1>
                
                {/* Nút đăng nhập trỏ thẳng về route hệ thống /login */}
                <Link 
                    to="/login" 
                    className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                    Đăng nhập Admin
                </Link>
            </div>

            <ul className="space-y-2">
                {articles.map(article => (
                    <li key={article.id}>
                        <Link 
                            to={`../article/${article.id}`} 
                            className="block p-4 rounded shadow border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                            <span className="block text-blue-600 font-medium mb-2">
                                {article.name}
                            </span>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                    Tác giả: {article.author}
                                </span>
                                {article.last_edited && (
                                    <span className="text-xs text-gray-400">
                                        Cập nhật: {article.last_edited}
                                    </span>
                                )}
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default HomePage;