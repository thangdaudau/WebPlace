import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import HomePage from "./guest/HomePage";
import ArticlePage from "./guest/ArticlePage";
import Login from "./admin/Login";
import DashBoard from "./admin/DashBoard";
import EditArticlePage from "./admin/EditArticlePage";
import AddArticlePage from "./admin/AddArticlePage";
import { AdminLayout } from "./layouts/AdminLayout"; // Import layout mới tạo
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/login" element={<Login />} />

          {/* ================= PROTECTED ADMIN ROUTES ================= */}
          <Route path="/:adminId" element={<AdminLayout />}>
            <Route path="dashboard" element={<DashBoard />} />
            <Route path="edit/:articleId" element={<EditArticlePage />} />
            <Route path="new" element={<AddArticlePage />} />
          </Route>

          {/* CATCH ALL: Xử lý fallback khi user gõ bậy bạ URL */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;