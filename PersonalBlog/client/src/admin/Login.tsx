import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query'; // Dùng chung hệ thống cache với toàn app

function Login() {
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoadingSubmit, setIsLoadingSubmit] = useState<boolean>(false);
    
    const navigate = useNavigate();

    // 1. KIỂM TRA SESSION CHỦ ĐỘNG: Check xem có phiên làm việc sẵn chưa
    const { data: authData, isLoading: isLoadingCheckAuth } = useQuery({
        queryKey: ['authMe'],
        queryFn: async () => {
            const res = await fetch('/api/auth/me');
            if (!res.ok) return null; // Không có session, coi như chưa đăng nhập
            return res.json(); // Trả về { authenticated: true, adminId: '...' }
        },
        retry: false,
        staleTime: 0, // Bắt buộc check real-time khi vào màn Login
    });

    // 2. ĐIỀU HƯỚNG SỚM: Nếu phát hiện đã có session, đá thẳng vào dashboard tương ứng
    useEffect(() => {
        if (authData && authData.authenticated && authData.adminId) {
            navigate(`/${authData.adminId}/dashboard`, { replace: true });
        }
    }, [authData, navigate]);

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
            return;
        }

        setIsLoadingSubmit(true);
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const contentType = response.headers.get("content-type");
            let data: any = {};
            
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data.error || `Yêu cầu thất bại với mã lỗi: ${response.status}`);
            }

            if (data && data.adminId) {
                navigate(`/${data.adminId}/dashboard`);
            } else {
                setError("Không nhận được định danh từ máy chủ.");
            }
            
        } catch (err: any) {
            console.error("Login Client Error:", err);
            setError(err.message || "Không thể kết nối đến máy chủ.");
        } finally {
            setIsLoadingSubmit(false);
        }
    };

    // 3. Trạng thái Loading ban đầu khi đang check session ngầm với Server
    if (isLoadingCheckAuth) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-600 font-medium">Đang xác thực phiên làm việc...</div>;
    }

    const isInteractionDisabled = isLoadingSubmit;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md border border-gray-200">
                <h2 className="text-2xl font-bold text-center text-gray-900">
                    Đăng nhập Hệ thống
                </h2>
                
                {error && (
                    <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="username">
                            Tên đăng nhập
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Nhập username"
                            disabled={isInteractionDisabled}
                        />
                    </div>
                    
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor="password">
                            Mật khẩu
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="••••••••"
                            disabled={isInteractionDisabled}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isInteractionDisabled}
                        className={`w-full py-2.5 px-4 font-semibold text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            isInteractionDisabled 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isLoadingSubmit ? 'Đang xác thực...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;