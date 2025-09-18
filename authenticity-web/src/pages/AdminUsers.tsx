import React, { useEffect, useState } from "react";
import {
  createUser,
  listUsers,
  activateUser,
  deactivateUser,
  createInstitution,
  listInstitutions,
  approveInstitution,
  revokeInstitution,
  updateInstitutionKey,
  updateUserRole,
  type Role,
} from "../api/admin";

// Utility to generate RSA public key PEM
async function generatePublicKeyPEM(): Promise<string> {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const exported = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const exportedAsString = String.fromCharCode(...new Uint8Array(exported));
  const exportedAsBase64 = window.btoa(exportedAsString);
  const pem = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64
    .match(/.{1,64}/g)
    ?.join("\n")}\n-----END PUBLIC KEY-----`;
  return pem;
}

// ------------------ Dashboard ------------------
export default function AdminDashboard() {
  const [tab, setTab] = useState<"users" | "institutions">("users");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F6FF] via-white to-[#EAFBFA] backdrop-blur-md">
      <div className="mx-auto max-w-7xl p-8">
        {/* Tabs */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setTab("users")}
            className={`rounded-xl px-6 py-2 font-semibold transition-all shadow-md backdrop-blur-lg ${
              tab === "users"
                ? "bg-[#EB8317] text-white"
                : "bg-white/50 text-[#10375C] hover:bg-white/70"
            }`}
          >
            👤 Users
          </button>
          <button
            onClick={() => setTab("institutions")}
            className={`rounded-xl px-6 py-2 font-semibold transition-all shadow-md backdrop-blur-lg ${
              tab === "institutions"
                ? "bg-[#EB8317] text-white"
                : "bg-white/50 text-[#10375C] hover:bg-white/70"
            }`}
          >
            🏛️ Institutions
          </button>
        </div>

        {tab === "users" ? <UsersPanel /> : <InstitutionsPanel />}
      </div>
    </div>
  );
}

// ------------------ Users Panel ------------------
function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("UNIVERSITY");
  const [institutionId, setInstitutionId] = useState("");
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  async function refresh() {
    const data = await listUsers();
    setUsers(data);
  }

  async function fetchInstitutions() {
    const data = await listInstitutions();
    setInstitutions(data.filter((i: any) => i.status === "APPROVED"));
  }

  useEffect(() => {
    refresh();
    fetchInstitutions();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      if (!institutionId && role !== "ADMIN") {
        alert("❌ Please select an institution for this user");
        return;
      }
      const payload: any = { email, password, role };
      if (role !== "ADMIN") payload.institution_id = institutionId;
      await createUser(payload);
      alert("✅ User created");
      refresh();
    } catch {
      alert("❌ Failed to create user");
    } finally {
      setLoading(false);
    }
  }

  async function onChangeRole(userId: string, newRole: Role) {
    try {
      await updateUserRole(userId, newRole);
      alert("✅ Role updated");
      refresh();
    } catch {
      alert("❌ Failed to update role");
    }
  }

  const filtered = users.filter(
    (u) =>
      (!search || u.email.toLowerCase().includes(search.toLowerCase())) &&
      (roleFilter === "ALL" || u.role === roleFilter)
  );
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="space-y-10">
      {/* Create User Card */}
      <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6 shadow-xl">
        <h2 className="text-xl font-bold text-[#EB8317] mb-4">➕ Create User</h2>
        <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
          <input
            type="email"
            placeholder="Email"
            className="rounded-lg border border-[#10375C]/40 px-3 py-2 focus:ring-2 focus:ring-[#4FB7B3] focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="rounded-lg border border-[#10375C]/40 px-3 py-2 focus:ring-2 focus:ring-[#4FB7B3] focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-lg border border-[#10375C]/40 px-3 py-2"
          >
            <option value="UNIVERSITY">University</option>
            <option value="STUDENT">Student</option>
            <option value="ADMIN">Admin</option>
          </select>
          {role !== "ADMIN" && (
            <select
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              className="rounded-lg border border-[#10375C]/40 px-3 py-2"
              required
            >
              <option value="">-- Select Institution --</option>
              {institutions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="submit"
            disabled={loading}
            className="col-span-full rounded-lg bg-gradient-to-r from-[#4FB7B3] to-[#3AA29E] px-4 py-2 font-medium text-white shadow-md hover:shadow-lg"
          >
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>

      {/* User Table */}
      <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg shadow-xl overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/30 bg-white/40">
          <input
            type="text"
            placeholder="🔍 Search by email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-lg border border-[#10375C]/30 px-3 py-2 text-sm focus:ring-2 focus:ring-[#4FB7B3]"
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as Role | "ALL");
              setPage(1);
            }}
            className="rounded-lg border border-[#10375C]/30 px-3 py-2 text-sm"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="UNIVERSITY">University</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-[#4FB7B3]/20 text-[#10375C]">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Institution</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((u) => (
              <tr key={u.id} className="border-t border-white/30 hover:bg-white/60">
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => onChangeRole(u.id, e.target.value as Role)}
                    className="rounded border px-2 py-1"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="UNIVERSITY">University</option>
                    <option value="STUDENT">Student</option>
                  </select>
                </td>
                <td className="px-4 py-2">{u.institution_id || "-"}</td>
                <td className="px-4 py-2">
                  {u.is_active ? (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 space-x-2">
                  {u.is_active ? (
                    <button
                      onClick={async () => {
                        await deactivateUser(u.id);
                        refresh();
                      }}
                      className="rounded px-3 py-1 text-white bg-[#EB8317] hover:opacity-90"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        await activateUser(u.id);
                        refresh();
                      }}
                      className="rounded px-3 py-1 text-white bg-[#10375C] hover:opacity-90"
                    >
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500 italic">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 bg-white/40 border-t border-white/30 text-sm">
          <p>
            Page {page} of {totalPages || 1}
          </p>
          <div className="flex items-center gap-3">
            <label>Rows per page:</label>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded border px-2 py-1 text-sm"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border bg-white/60 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border bg-white/60 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------ Institutions Panel ------------------
function InstitutionsPanel() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [name, setName] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  async function refresh() {
    const data = await listInstitutions();
    setInstitutions(data);
  }
  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const publicKey = await generatePublicKeyPEM();
      await createInstitution({ name, public_key_pem: publicKey });
      alert("✅ Institution created with auto-generated public key");
      setName("");
      refresh();
    } catch {
      alert("❌ Failed to create institution");
    }
  }

  const filtered = institutions.filter(
    (i) =>
      (!search || i.name.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === "ALL" || i.status === statusFilter)
  );
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  return (
    <div className="space-y-10">
      {/* Create Institution Card */}
      <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg p-6 shadow-xl">
        <h2 className="text-xl font-bold text-[#EB8317] mb-4">🏛️ Create Institution</h2>
        <form onSubmit={onCreate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <input
            placeholder="Institution Name"
            className="flex-1 rounded-lg border border-[#10375C]/40 px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-[#10375C] to-[#4FB7B3] px-5 py-2 font-medium text-white shadow-md hover:shadow-lg"
          >
            Create & Generate Key
          </button>
        </form>
      </div>

      {/* Institutions Table */}
      <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-lg shadow-xl overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/30 bg-white/40">
          <input
            type="text"
            placeholder="🔍 Search institution..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-lg border border-[#10375C]/30 px-3 py-2 text-sm focus:ring-2 focus:ring-[#4FB7B3]"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-[#10375C]/30 px-3 py-2 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REVOKED">Revoked</option>
          </select>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-[#4FB7B3]/20 text-[#10375C]">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created At</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((i) => (
              <tr key={i.id} className="border-t border-white/30 hover:bg-white/60">
                <td className="px-4 py-2">{i.name}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      i.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : i.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {i.status}
                  </span>
                </td>
                <td className="px-4 py-2">{i.created_at}</td>
                <td className="px-4 py-2 space-x-2">
                  {i.status !== "APPROVED" && (
                    <button
                      onClick={async () => {
                        await approveInstitution(i.id);
                        refresh();
                      }}
                      className="rounded px-3 py-1 text-white bg-[#10375C] hover:opacity-90"
                    >
                      Approve
                    </button>
                  )}
                  {i.status === "APPROVED" && (
                    <button
                      onClick={async () => {
                        await revokeInstitution(i.id);
                        refresh();
                      }}
                      className="rounded px-3 py-1 text-white bg-[#EB8317] hover:opacity-90"
                    >
                      Revoke
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      const newKey = await generatePublicKeyPEM();
                      await updateInstitutionKey(i.id, newKey);
                      refresh();
                      alert("🔑 New key generated & updated");
                    }}
                    className="rounded px-3 py-1 text-white bg-[#4FB7B3] hover:opacity-90"
                  >
                    Update Key
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-gray-500 italic">
                  No institutions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 bg-white/40 border-t border-white/30 text-sm">
          <p>
            Page {page} of {totalPages || 1}
          </p>
          <div className="flex items-center gap-3">
            <label>Rows per page:</label>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded border px-2 py-1 text-sm"
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded border bg-white/60 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded border bg-white/60 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
