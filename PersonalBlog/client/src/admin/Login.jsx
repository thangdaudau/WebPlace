import { useState } from 'react';
import { useNavigate } from 'react-router';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password.trim()) {
            setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Tài khoản hoặc mật khẩu không chính xác.');
            }

            navigate('/admin/dashboard');
            
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow"
                            placeholder="Nhập username"
                            disabled={isLoading}
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
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-shadow"
                            placeholder="••••••••"
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-2.5 px-4 font-semibold text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            isLoading 
                                ? 'bg-blue-400 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;