import { useParams, Link } from 'react-router';
import { useEffect, useState } from 'react';

function ArticlePage() {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/articles/${id}`)
            .then(res => {
                if (!res.ok) throw new Error("Không tìm thấy");
                return res.json();
            })
            .then(data => {
                setArticle(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div>Đang tải bài viết...</div>;
    if (!article) return <div>Bài viết không tồn tại.</div>;

    return (
        <div className="p-4">
            <Link to="../home" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Quay lại</Link>
            <h1 className="text-3xl font-bold">{article.name}</h1>
            <div className="text-sm text-gray-500 my-2">
                <span>Tác giả: {article.author}</span> | <span>Ngày tạo: {article.created_at}</span>
            </div>
            <div className="mt-4 border-t pt-4">
                {article.content}
            </div>
        </div>
    );
}

export default ArticlePage;