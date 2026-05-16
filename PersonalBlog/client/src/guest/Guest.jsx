import { Routes, Route } from "react-router";
import HomePage from "./HomePage";
import ArticlePage from "./ArticlePage";

function Guest() {
    return (
        <Routes>
            <Route path="home?" element={<HomePage />} />
            <Route path="article/:id" element={<ArticlePage />} />
        </Routes>
    );
}

export default Guest;