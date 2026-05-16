import { BrowserRouter, Routes, Route } from "react-router";
import Guest from "./guest/Guest";
import Admin from "./admin/Admin";
import Login from "./admin/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='login' element={<Login />} />
        <Route path='guest/*' element={<Guest />} />
        <Route path='admin/*' element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App