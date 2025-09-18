import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../auth/useAuth";
import { AlertCircle, Eye, EyeOff, Loader2, Mail } from "lucide-react";

type LoginProps = {
  onSuccess?: () => void; // ✅ added optional onSuccess
};

export default function Login({ onSuccess }: LoginProps) {
  const nav = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);

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
      const role: "ADMIN" | "UNIVERSITY" | "STUDENT" = res.role;

      setAuth(res.access_token, role, res.refresh_token);

      // ✅ Close modal if provided
      if (onSuccess) onSuccess();

      // ✅ redirect to dashboard
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
    <div className="w-full max-w-md rounded-2xl border border-[#4FB7B3]/30 bg-white shadow-xl p-8">
      {/* Heading */}
      <div className="space-y-1 mb-6 text-center">
        <h2 className="text-3xl font-bold text-[#EB8317]">Welcome Back</h2>
        <p className="text-sm text-[#10375C]/80">
          Sign in to access your dashboard
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
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[#4FB7B3]/40 bg-white px-10 py-2 text-sm placeholder-slate-400 text-[#10375C] focus:border-[#4FB7B3] focus:ring focus:ring-[#4FB7B3]/30 outline-none"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-[#10375C]"
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

        {/* Remember + Forgot */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-[#10375C]/80">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-[#4FB7B3]/50 text-[#4FB7B3] focus:ring-[#4FB7B3]"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => alert("Forgot password flow not implemented yet.")}
            className="text-sm text-[#4FB7B3] hover:underline"
          >
            Forgot password?
          </button>
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

      {/* Terms */}
      <div className="mt-6 text-center text-xs text-[#10375C]/70">
        By signing in, you agree to our Terms and Privacy Policy.
      </div>
    </div>
  );
}
