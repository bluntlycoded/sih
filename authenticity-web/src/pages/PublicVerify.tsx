import React, { useState } from "react";
import { verifyById } from "../api/public";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function PublicVerify() {
  const [id, setId] = useState("");
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await verifyById(id);
      setRes(data);
    } catch {
      setRes({ error: "Verification failed." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Public Verify</h1>
        </div>

        {/* Form */}
        <form onSubmit={onVerify} className="flex gap-3">
          <input
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            placeholder="Certificate ID (UUID)"
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check"}
          </button>
        </form>

        {/* Result */}
        {res && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h2 className="mb-2 text-sm font-semibold text-gray-600">
              Verification Result
            </h2>
            <pre className="max-h-60 overflow-auto rounded bg-gray-800 p-3 text-xs text-green-300">
              {JSON.stringify(res, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
