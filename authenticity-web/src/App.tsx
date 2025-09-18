import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Protected } from "./auth/Protected";
import Navbar from "./components/Navbar";

// pages
import LoginPage from "../src/pages/Login";
import AdminDashboard from "../src/pages/AdminUsers";
import UniversityDashboard from "../src/pages/UniversityIssue";
import StudentDashboard from "./pages/StudentDashboard";
import PublicVerify from "./pages/PublicVerify";
import HomePage from "./pages/Home";

// Wrapper to handle layouts
function AppLayout() {
  const location = useLocation();

  // Routes where we don't want Navbar / extra padding
  const authRoutes = ["/login", "/register"];
  const isAuthPage = authRoutes.includes(location.pathname);

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* if you add register later */}
        {/* <Route path="/register" element={<RegisterPage />} /> */}
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 dark:bg-slate-950">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/admin"
            element={
              <Protected allow={["ADMIN"]}>
                <AdminDashboard />
              </Protected>
            }
          />

          <Route
            path="/university"
            element={
              <Protected allow={["UNIVERSITY"]}>
                <UniversityDashboard />
              </Protected>
            }
          />

          <Route
            path="/student"
            element={
              <Protected allow={["STUDENT"]}>
                <StudentDashboard />
              </Protected>
            }
          />

          <Route path="/verify" element={<PublicVerify />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
