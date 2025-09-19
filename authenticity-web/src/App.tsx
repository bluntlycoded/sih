import  { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { Protected } from "./auth/Protected";
import Navbar from "./components/Navbar";


// pages
import AdminDashboard from "./pages/AdminUsers";
import UniversityDashboard from "./pages/UniversityIssue";
import StudentDashboard from "./pages/StudentDashboard";
import HomePage from "./pages/Home";
import NotFound from "./pages/NotFound";

// login modal
import Login from "./pages/Login";

// ---------------- App Layout ----------------
function AppLayout() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar with login button hook */}
      <Navbar onLoginClick={() => setLoginOpen(true)} />

      <main className="flex-1 bg-gray-50 dark:bg-slate-950">
        <Routes>
          <Route path="/" element={<HomePage />} />
<Route path="*" element={<NotFound />} />
<Route path="/logout" element={<HomePage />} />
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
        </Routes>
      </main>

      {/* Login Modal */}
      {loginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setLoginOpen(false)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            {/* Pass onSuccess so login can close modal */}
            <Login onSuccess={() => setLoginOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Main App ----------------
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
