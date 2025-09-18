import React, { useState } from "react";
import { createUser } from "../api/admin";

export default function AdminUsers() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "UNIVERSITY" | "STUDENT">("UNIVERSITY");
  const [institutionId, setInstitutionId] = useState<string>("9c0a5c44-98e0-4b0c-a4a9-f4e6fb31fc4d");
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const payload: any = { email, password, role };
      if (role !== "ADMIN") payload.institution_id = institutionId;
      const data = await createUser(payload);
      setRes(data);
      alert("✅ User created successfully");
    } catch {
      alert("❌ Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        Admin Panel <span className="text-indigo-600">• Create User</span>
      </h1>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <form onSubmit={onCreate} className="space-y-5 p-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              placeholder="e.g. user@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
            >
              <option value="UNIVERSITY">University</option>
              <option value="STUDENT">Student</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Institution ID */}
          {role !== "ADMIN" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institution ID
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
                placeholder="Institution UUID"
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                required
              />
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>

      {/* Response */}
      {res && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
          <h2 className="mb-2 font-medium text-gray-800">Response:</h2>
          <pre className="overflow-x-auto text-gray-700">
            {JSON.stringify(res, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
