import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { LogOut, UserCircle } from "lucide-react";

export default function Navbar() {
  const nav = useNavigate();
  const { role, logout } = useAuth();

  const baseLink =
    "px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200";
  const activeLink =
    "text-white bg-indigo-600 shadow-sm";
  const inactiveLink =
    "text-slate-700 hover:text-indigo-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-indigo-400 dark:hover:bg-slate-800";

  const navItem = (to: string, label: string) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        `${baseLink} ${isActive ? activeLink : inactiveLink}`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white dark:bg-slate-900 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white hover:opacity-80"
          >
            Authenticity
          </Link>
          <span className="hidden text-sm text-slate-400 sm:inline">
            trust, but verify
          </span>
        </div>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-4">
          {navItem("/verify", "Verify")}
          {navItem("/student", "Student")}
          {navItem("/university", "University")}
          {navItem("/admin", "Admin")}
        </nav>

        {/* Right side auth */}
        <div className="flex items-center gap-3">
          {!role ? (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `${baseLink} ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "text-indigo-600 border border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-700 dark:hover:bg-slate-800"
                }`
              }
            >
              Login
            </NavLink>
          ) : (
            <div className="flex items-center gap-3">
              {/* Role badge */}
              <span className="hidden sm:flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <UserCircle className="h-4 w-4" />
                {role}
              </span>
              {/* Logout button */}
              <button
                onClick={() => {
                  logout();
                  nav("/login");
                }}
                className="flex items-center gap-1 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-800/60 transition"
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
