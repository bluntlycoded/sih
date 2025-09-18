
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { LogOut, UserCircle } from "lucide-react";

type NavbarProps = {
  onLoginClick: () => void;
};

export default function Navbar({ onLoginClick }: NavbarProps) {
  const nav = useNavigate();
  const { role, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-[#4FB7B3] bg-[#4FB7B3] shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + Tagline */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-white hover:opacity-90"
          >
            Authenticity
          </Link>
          <span className="hidden text-sm text-white/80 sm:inline">
            trust, but verify
          </span>
        </div>

        {/* Right side auth */}
        <div className="flex items-center gap-3">
          {!role ? (
            <button
              onClick={onLoginClick}
              className="px-3 py-2 text-sm font-medium rounded-md text-white border border-white/30 hover:bg-white/20 transition"
            >
              Login
            </button>
          ) : (
            <div className="flex items-center gap-3">
              {/* Role badge */}
              <span className="hidden sm:flex items-center gap-1 rounded-md bg-white/20 px-3 py-1 text-xs font-medium text-white">
                <UserCircle className="h-4 w-4" />
                {role}
              </span>
              {/* Logout button */}
              <button
                onClick={() => {
                  logout();
                  nav("/"); // ✅ redirect to home after logout
                }}
                className="flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
