import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../auth/useAuth";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Mail,
} from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

  function getRoleFromEmail(userEmail: string): "ADMIN" | "UNIVERSITY" | "STUDENT" {
    if (userEmail.includes("admin")) return "ADMIN";
    if (userEmail.includes("vitap")) return "UNIVERSITY";
    return "STUDENT";
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(trimmedEmail, password);
      const role = getRoleFromEmail(trimmedEmail);

      setAuth(res.access_token, role, res.refresh_token);

      if (role === "ADMIN") nav("/admin");
      else if (role === "UNIVERSITY") nav("/university");
      else nav("/student");
    } catch (err) {
      console.error(err);
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xl backdrop-blur p-8">
        {/* Heading */}
        <div className="space-y-1 mb-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-10 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-500/40 outline-none"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm placeholder-slate-400 focus:border-indigo-500 focus:ring focus:ring-indigo-200 dark:focus:ring-indigo-500/40 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 mr-2 inline-flex items-center justify-center rounded-md p-2 text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-slate-400 dark:hover:text-slate-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => alert("Forgot password flow not implemented yet.")}
              className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={() => nav("/register")}
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Create one
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          By signing in, you agree to our Terms and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
