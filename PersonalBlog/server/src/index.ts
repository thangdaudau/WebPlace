'use strict';

// Load biến môi trường ngay đầu file trước khi các module khác chạy
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import type { Request, Response, NextFunction, Application } from 'express';
import session from 'express-session';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Kiểm tra Fail-Fast: Thiếu key hệ thống là sập ngay lập tức khi khởi động
if (!process.env.SESSION_SECRET) {
  console.error("CRITICAL ERROR: SESSION_SECRET is not defined in .env file.");
  process.exit(1);
}

declare module 'express-session' {
  interface SessionData {
    adminId: number | string;
    username: string;
  }
}

const app: Application = express();
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

app.use(express.json());

const articlesFilePath: string = path.join(__dirname, '..', 'storage', 'articles.json');
const adminsFilePath: string = path.join(__dirname, '..', 'storage', 'admins.json');

interface Article {
  id: number | string;
  author: string;
  author_id: string;
  created_at: string;
  last_edited: string;
  title: string;
  content: string;
}

interface Admin {
  id: number | string;
  username: string;
  password_hashed: string;
  created_at: string;
}

async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  } catch (err) {
    console.error(`Lỗi đọc file tại ${filePath}:`, err);
    throw new Error("Internal Server Error");
  }
}

// ==================== MIDDLEWARE & CONFIG ====================

app.use(
  session({
    secret: process.env.SESSION_SECRET, // Lấy từ .env bảo mật
    resave: false,                               
    saveUninitialized: false,                
    cookie: {
      httpOnly: true,                        
      secure: process.env.NODE_ENV === 'production', // Tự động bật secure nếu chạy production (HTTPS)
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    }
  })
);

function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ error: "Yêu cầu đăng nhập hệ thống." });
  }
  next(); 
}

// ==================== API ROUTING ====================

// [POST] /api/login
app.post('/api/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin." });
    }

    const admins = await readJsonFile<Admin[]>(adminsFilePath);
    const admin = admins.find(a => a.username === username);
    if (!admin) {
      return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
    }

    // Bcrypt tự xử lý salt nội bộ và tích hợp sẵn chống Timing Attack
    const isPasswordValid = await bcrypt.compare(password, admin.password_hashed);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Tài khoản hoặc mật khẩu không chính xác." });
    }

    // Hủy session cũ, cấp Session ID mới hoàn toàn để chống Session Fixation
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: "Không thể khởi tạo phiên làm việc." });
      }
      req.session.adminId = admin.id;
      req.session.username = admin.username;
  
      res.json({ success: true, message: "Đăng nhập thành công.", adminId: admin.id })
    });
  } catch (err) {
    console.error("Login System Error:", err); // Log lỗi thực tế ra console của server để debug
    res.status(500).json({ error: "Lỗi hệ thống." });
  }
});

// [GET] /api/auth/me - Check xem session hiện tại là của ai
app.get('/api/auth/me', (req: Request, res: Response) => {
  if (!req.session || !req.session.adminId) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({ 
    authenticated: true, 
    adminId: req.session.adminId, 
    username: req.session.username 
  });
});

// [GET] Dashboard
app.get('/api/:id/dashboard', requireAdminAuth, async (req: Request, res: Response) => {
try {
    const paramAdminId = req.params.id;
    const sessionAdminId = req.session.adminId?.toString();

    // PHÒNG VỆ PRODUCTION: Chống lỗi BOLA / IDOR
    if (paramAdminId !== sessionAdminId) {
      return res.status(403).json({ 
        error: "Từ chối truy cập. Bạn không có quyền xem dữ liệu của quản trị viên khác." 
      });
    }

    const allArticles = await readJsonFile<Article[]>(articlesFilePath);
    const userArticles = allArticles.filter(
      (article) => article.author_id?.toString() === sessionAdminId
    );

    res.json(userArticles);

  } catch (err: any) {
    console.error(`Dashboard Fetch Error (Admin ${req.params.id}):`, err);
    res.status(500).json({ error: "Lỗi hệ thống khi tải danh sách bài viết." });
  }
});

// [POST] Logout
app.post('/api/logout', (req: Request, res: Response) => {
  req.session.destroy((err: any) => {
    if (err) return res.status(500).json({ error: "Không thể logout." });
    res.clearCookie('connect.sid'); 
    res.json({ success: true, message: "Đã đăng xuất." });
  });
});

// [GET] Toàn bộ bài viết
app.get('/api/articles', async (req: Request, res: Response) => {
  try {
    const articles = await readJsonFile<Article[]>(articlesFilePath);
    res.json(articles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// [GET] Chi tiết bài viết
app.get('/api/articles/:id', async (req: Request, res: Response) => {
  try {
    const articles = await readJsonFile<Article[]>(articlesFilePath);
    const article = articles.find(a => a.id.toString() === req.params.id);

    if (!article) {
      return res.status(404).json({ error: "Không tìm thấy bài viết" });
    }
    res.json(article);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// [PUT] Cập nhật bài viết - Chỉ áp dụng cho chính tác giả của bài viết đó
app.put('/api/articles/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const articleId = req.params.id;
    const sessionAdminId = req.session.adminId?.toString();
    const { title, content } = req.body;

    // PHÒNG VỆ PRODUCTION: Kiểm tra dữ liệu đầu vào (Validation)
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: "Tiêu đề và nội dung không được để trống." });
    }

    const articles = await readJsonFile<Article[]>(articlesFilePath);
    const articleIndex = articles.findIndex(a => a.id.toString() === articleId);

    if (articleIndex === -1) {
      return res.status(404).json({ error: "Bài viết không tồn tại hoặc đã bị xóa trước đó." });
    }

    const currentArticle = articles[articleIndex]!;

    // CHỐNG BOLA (Bảo mật tối thượng): Kiểm tra xem Admin đang log có phải chủ bài viết không
    if (currentArticle!.author_id?.toString() !== sessionAdminId) {
      return res.status(403).json({ 
        error: "Từ chối thao tác. Bạn không có quyền chỉnh sửa bài viết của người khác." 
      });
    }

    // Tiến hành cập nhật dữ liệu mới, giữ nguyên các trường cũ (id, author, author_id, created_at)
    // Tự động cập nhật thời gian chỉnh sửa (last_edited) dựa trên timezone hệ thống
    const updatedArticle: Article = {
      ...currentArticle,
      title: title.trim(),
      content: content.trim(),
      last_edited: new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    };

    articles[articleIndex] = updatedArticle;

    // Ghi mảng mới ngược trở lại vào file JSON lưu trữ
    // Thêm tham số null, 2 để format file JSON cho đẹp mắt, dễ debug trực tiếp trên server
    await fs.writeFile(articlesFilePath, JSON.stringify(articles, null, 2), 'utf8');

    res.json(updatedArticle);

  } catch (err: any) {
    console.error(`Update Article Error (ID ${req.params.id}):`, err);
    res.status(500).json({ error: "Lỗi hệ thống không thể lưu cập nhật bài viết." });
  }
});

// [POST] Tạo bài viết mới - Tự động gán thông tin tác giả từ Session bảo mật
app.post('/api/articles', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    const sessionAdminId = req.session.adminId;
    const sessionUsername = req.session.username;

    // PHÒNG VỆ PRODUCTION: Kiểm tra dữ liệu đầu vào không được rỗng
    if (!title || !title.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: "Tiêu đề và nội dung bài viết không được để trống." });
    }

    const articles = await readJsonFile<Article[]>(articlesFilePath);

    // Quy trình tự sinh ID an toàn dạng số (Tăng dần dựa trên ID lớn nhất hiện tại)
    const nextId = articles.length > 0 
      ? Math.max(...articles.map(a => parseInt(a.id.toString(), 10) || 0)) + 1 
      : 1;

    // Tạo Object bài viết mới chuẩn chỉnh cấu trúc dữ liệu hệ thống
    // Toàn bộ thông tin tác giả được ép từ Session xuống chứ không tin tưởng Client truyền lên
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const newArticle: Article = {
      id: nextId,
      title: title.trim(),
      content: content.trim(),
      author: sessionUsername!,       // Lấy từ session an toàn chống giả mạo tên
      author_id: sessionAdminId!.toString(), // Lưu dưới dạng string để đồng bộ so sánh
      created_at: now,
      last_edited: now
    };

    // Thêm phần tử mới vào đầu mảng (để bài viết mới xuất hiện trên cùng)
    articles.unshift(newArticle);
    await fs.writeFile(articlesFilePath, JSON.stringify(articles, null, 2), 'utf8');

    res.status(201).json(newArticle);

  } catch (err: any) {
    console.error("Create Article Server Error:", err);
    res.status(500).json({ error: "Lỗi hệ thống, không thể xuất bản bài viết mới." });
  }
});

// [DELETE] Xóa bài viết - Chỉ cho phép chính tác giả xóa bài của mình
app.delete('/api/articles/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const articleId = req.params.id;
    const sessionAdminId = req.session.adminId?.toString();

    const articles = await readJsonFile<Article[]>(articlesFilePath);
    const article = articles.find(a => a.id.toString() === articleId);

    if (!article) {
      return res.status(404).json({ error: "Bài viết không tồn tại hoặc đã bị xóa trước đó." });
    }

    // CHỐNG IDOR / BOLA: Kiểm tra xem Admin yêu cầu xóa có phải chủ bài viết không
    if (article.author_id?.toString() !== sessionAdminId) {
      return res.status(403).json({ 
        error: "Từ chối thao tác. Bạn không có quyền xóa bài viết của quản trị viên khác." 
      });
    }

    const remainingArticles = articles.filter(a => a.id.toString() !== articleId);
    await fs.writeFile(articlesFilePath, JSON.stringify(remainingArticles, null, 2), 'utf8');

    // Trả về phản hồi thành công
    res.json({ success: true, message: "Đã xóa bài viết thành công." });

  } catch (err: any) {
    console.error(`Delete Article Error (ID ${req.params.id}):`, err);
    res.status(500).json({ error: "Lỗi hệ thống không thể xóa bài viết." });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});