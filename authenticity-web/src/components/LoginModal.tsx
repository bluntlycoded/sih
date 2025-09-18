import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../auth/useAuth";
import { AlertCircle, Eye, EyeOff, Loader2, Mail, X } from "lucide-react";
import type { Role } from "../auth/AuthContext";

type Props = {
  onClose: () => void;
};

export default function LoginModal({ onClose }: Props) {
  const nav = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password);
      const role: Role = res.role;

      // ✅ Save auth in context + storage
      setAuth(res.access_token, role, res.refresh_token);

      // ✅ Redirect to dashboard
      if (role === "ADMIN") nav("/admin");
      else if (role === "UNIVERSITY") nav("/university");
      else nav("/student");

      // ✅ Close modal
      onClose();
    } catch (err) {
      console.error(err);
      setError("Login failed. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl border border-[#4FB7B3]/30 bg-white shadow-xl p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full p-1 text-gray-500 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Heading */}
        <div className="space-y-1 mb-6 text-center">
          <h2 className="text-2xl font-bold text-[#EB8317]">Sign In</h2>
          <p className="text-sm text-[#10375C]/80">
            Enter your credentials to continue
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-[#10375C]">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4FB7B3]" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-[#4FB7B3]/40 bg-white px-10 py-2 text-sm text-[#10375C] placeholder-slate-400 focus:border-[#4FB7B3] focus:ring focus:ring-[#4FB7B3]/30 outline-none"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-[#10375C]">
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
                className="w-full rounded-md border border-[#4FB7B3]/40 bg-white px-3 py-2 text-sm text-[#10375C] placeholder-slate-400 focus:border-[#4FB7B3] focus:ring focus:ring-[#4FB7B3]/30 outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 mr-2 inline-flex items-center justify-center rounded-md p-2 text-[#4FB7B3] hover:text-[#10375C] focus:outline-none focus:ring-2 focus:ring-[#4FB7B3]/50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-[#4FB7B3] px-4 py-2 text-sm font-medium text-white hover:bg-[#3aa7a3] focus:outline-none focus:ring-2 focus:ring-[#4FB7B3]/50 disabled:opacity-50"
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
      </div>
    </div>
  );
}
