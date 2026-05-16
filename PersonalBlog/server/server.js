'use-strict'

const express = require('express');
const session = require('express-session');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 5000;

// CRITICAL FIX: Bắt buộc phải có middleware này để parse JSON body từ client gửi lên
app.use(express.json());

const articlesFilePath = path.join(__dirname, 'storage', 'articles.json');
const adminsFilePath = path.join(__dirname, 'storage', 'admins.json');

// Helper function: Đọc và parse dữ liệu tránh lặp code (DRY)
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Lỗi đọc file tại ${filePath}:`, err);
        throw new Error("Internal Server Error");
    }
}

// ==================== API ROUTING ====================

app.use(session({
    secret: 'super-secret-key-dien-vao-day', // Chuỗi để ký Session ID, không được lộ
    resave: false,                           // Không lưu lại session nếu không có thay đổi
    saveUninitialized: false,                // Không tạo session trống cho user chưa login
    cookie: { 
        httpOnly: true,                      // CRITICAL: Cấm Javascript (React) tiếp cận Cookie này -> Chống XSS
        secure: false,                       // Đổi thành true nếu chạy HTTPS trên production
        maxAge: 24 * 60 * 60 * 1000          // Session sống trong 1 ngày (tính bằng ms)
    }
}));

// Thằng nào chưa login mà mò vào route Admin sẽ bị tống cổ bằng 401 Unauthorized
function requireAdminAuth(req, res, next) {
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: "Yêu cầu đăng nhập hệ thống." });
    }
    next(); // Hợp lệ thì cho đi tiếp
}

// [POST] /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin." });
        }

        const admins = await readJsonFile(adminsFilePath);
        const admin = admins.find(a => a.username === username);
        if (!admin) {
            return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
        }

        const inputHash = crypto.createHash('sha256').update(password).digest('hex');
        const accountBuf = Buffer.from(admin.password_hashed, 'utf8');
        const inputBuf = Buffer.from(inputHash, 'utf8');

        if (accountBuf.length !== inputBuf.length || !crypto.timingSafeEqual(accountBuf, inputBuf)) {
            return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
        }

        // --- ĐĂNG NHẬP THÀNH CÔNG -> GHI DATA VÀO SESSION ---
        // Express-session sẽ tự động sinh Session ID, tạo cookie và ném về cho Client
        req.session.adminId = admin.id;
        req.session.username = admin.username;

        res.json({ success: true, message: "Đăng nhập thành công." });

    } catch (err) {
        res.status(500).json({ error: "Lỗi hệ thống." });
    }
});

// [GET] Route nội bộ của Admin - Được bảo vệ bởi Middleware
app.get('/api/admin/dashboard', requireAdminAuth, (req, res) => {
    // Lấy thông tin trực tiếp từ session ra xài, không tin bất kỳ data nào client gửi lên
    res.json({ 
        message: `Chào mừng Admin ${req.session.username} trở lại. Đây là data tối mật.`,
        secretData: [1, 2, 3, 4, 5]
    });
});

// [POST] Logout - Hủy session
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: "Không thể logout." });
        res.clearCookie('connect.sid'); // Tên cookie mặc định của express-session
        res.json({ success: true, message: "Đã đăng xuất." });
    });
});

// [GET] Lấy danh sách toàn bộ bài viết
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await readJsonFile(articlesFilePath);
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// [GET] Lấy chi tiết một bài viết theo ID
app.get('/api/articles/:id', async (req, res) => {
    try {
        const articles = await readJsonFile(articlesFilePath);
        const article = articles.find(a => a.id.toString() === req.params.id);
        
        if (!article) {
            return res.status(404).json({ error: "Không tìm thấy bài viết" });
        }
        res.json(article);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});