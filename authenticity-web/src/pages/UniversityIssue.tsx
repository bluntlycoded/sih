// src/pages/UniversityIssue.tsx
import React, { useEffect, useState } from "react";
import api from "../api/client";
import { Loader2 } from "lucide-react";
import type { JSX } from "react/jsx-runtime";

// ---------------- Types ----------------
export interface CertificateOut {
  id: string;
  institution_id: string;
  student_id: string;
  sha256_hash: string;
  signature: string;
  status: string;
  certificate_name: string;
  image_url?: string | null;
  payload?: Record<string, any>;
  pdf_url?: string | null;
  blockchain_tx?: string | null;
  created_at: string;
}

export interface StudentOut {
  id: string;
  reg_number: string;
  name: string;
  program: string;
  email: string;
  institution_id: string;
  is_active?: boolean;
  created_at?: string;
}

// ---------------- Component ----------------
export default function UniversityDashboard(): JSX.Element {
  const [activeTab, setActiveTab] = useState<
    "issue" | "list" | "students" | "addStudent"
  >("issue");

  const [institutionId, setInstitutionId] = useState<string>("");

  // fetch /me to get institution_id
  useEffect(() => {
    async function fetchMe() {
      try {
        const { data } = await api.get("/me");
        setInstitutionId(data.institution_id || "");
      } catch (err) {
        console.error("Failed to fetch /me:", err);
        setInstitutionId("");
      }
    }
    fetchMe();
  }, []);

  // ---------- ISSUE CERTIFICATE ----------
  const [studentReg, setStudentReg] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [program, setProgram] = useState("");
  const [certificateName, setCertificateName] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [issueImage, setIssueImage] = useState<File | null>(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueResult, setIssueResult] = useState<CertificateOut | null>(null);

  async function fetchStudentByReg() {
    if (!studentReg) {
      alert("Enter registration number to autofill");
      return;
    }
    try {
      const { data } = await api.get<StudentOut>(`/issuer/students/${studentReg}`);
      setStudentId(data.id);
      setStudentName(data.name);
      setProgram(data.program);
      alert("Autofill successful");
    } catch (err) {
      console.error("Autofill failed:", err);
      alert("Student not found for this reg number");
    }
  }

  async function onIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !studentName || !program || !issueDate || !certificateName || !issueImage) {
      alert("Please fill all fields and upload an image.");
      return;
    }

    setIssueLoading(true);
    setIssueResult(null);

    const payload = {
      student_name: studentName,
      program,
      issue_date: issueDate,
    };

    try {
      const formData = new FormData();
      formData.append("student_id", studentId);
      formData.append("certificate_name", certificateName);
      formData.append("payload", JSON.stringify(payload));
      formData.append("signature_b64", institutionId || "");
      formData.append("image", issueImage);

      const { data } = await api.post<CertificateOut>("/issuer/certificates", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setIssueResult(data);
      alert("Certificate issued successfully");
      await fetchCertificates();
      setActiveTab("list");

      // reset form
      setStudentReg("");
      setStudentId("");
      setStudentName("");
      setProgram("");
      setCertificateName("");
      setIssueDate("");
      setIssueImage(null);
    } catch (err: any) {
      console.error("Issue error:", err);
      alert(err?.response?.data?.detail || "Failed to issue certificate");
    } finally {
      setIssueLoading(false);
    }
  }

  // ---------- CERTIFICATE LIST ----------
  const [certs, setCerts] = useState<CertificateOut[]>([]);
  const [loadingCerts, setLoadingCerts] = useState<boolean>(true);

  async function fetchCertificates() {
    setLoadingCerts(true);
    try {
      const { data } = await api.get<CertificateOut[]>("/issuer/certificates");
      setCerts(data || []);
    } catch (err) {
      console.error("Failed to fetch certificates:", err);
      setCerts([]);
    } finally {
      setLoadingCerts(false);
    }
  }

  useEffect(() => {
    fetchCertificates();
  }, []);

  // ---------- STUDENTS ----------
  const [students, setStudents] = useState<StudentOut[]>([]);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(true);

  async function fetchStudents() {
    setLoadingStudents(true);
    try {
      const { data } = await api.get<StudentOut[]>("/issuer/students");
      setStudents(data || []);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  useEffect(() => {
    if (activeTab === "students") fetchStudents();
  }, [activeTab]);

  async function toggleStudentStatus(studentId: string, currentlyActive: boolean) {
    try {
      if (currentlyActive) {
        await api.post(`/issuer/students/${studentId}/deactivate`);
      } else {
        await api.post(`/issuer/students/${studentId}/activate`);
      }
      await fetchStudents();
    } catch (err) {
      console.error("Failed to toggle student status:", err);
      alert("Failed to update student status");
    }
  }

  // ---------- ADD STUDENT ----------
  const [newRegNumber, setNewRegNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [newProgram, setNewProgram] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  async function onAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!newRegNumber || !newName || !newProgram || !newEmail || !newPassword) {
      alert("Please fill all fields including email and password.");
      return;
    }
    setAddingStudent(true);
    try {
      await api.post<StudentOut>("/issuer/students", {
        reg_number: newRegNumber,
        name: newName,
        program: newProgram,
        email: newEmail,
        password: newPassword,
      });
      await fetchStudents();
      setActiveTab("students");
      setNewRegNumber("");
      setNewName("");
      setNewProgram("");
      setNewEmail("");
      setNewPassword("");
      alert("Student added successfully");
    } catch (err: any) {
      console.error("Failed to add student:", err);
      alert(err?.response?.data?.detail || "Failed to add student");
    } finally {
      setAddingStudent(false);
    }
  }

  // ---------- UI Helpers ----------
  function formatDate(ts?: string) {
    if (!ts) return "-";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  }

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-[#F4F6FF] py-10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#4FB7B3]/30 mb-8">
          {[
            { key: "issue", label: "Issue Certificate" },
            { key: "list", label: "Issued Certificates" },
            { key: "students", label: "Students List" },
            { key: "addStudent", label: "Add Student" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-5 py-2 rounded-t-lg font-medium transition ${
                activeTab === t.key
                  ? "bg-white shadow text-[#10375C]"
                  : "text-[#10375C]/70 hover:text-[#10375C]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-[#4FB7B3]/30 shadow-xl p-8">
          {/* Issue Certificate */}
          {activeTab === "issue" && (
            <div>
              <h1 className="mb-6 text-2xl font-bold text-[#10375C]">Issue Certificate</h1>
              <form onSubmit={onIssue} className="space-y-5">
                {/* Autofill */}
                <div className="flex gap-3">
                  <input
                    className="flex-1 rounded-lg border px-3 py-2"
                    placeholder="Student Reg Number (for autofill)"
                    value={studentReg}
                    onChange={(e) => setStudentReg(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={fetchStudentByReg}
                    className="px-4 py-2 rounded-lg bg-[#4FB7B3] text-white hover:bg-[#3aa7a3]"
                  >
                    Autofill
                  </button>
                </div>
                {/* Student info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="rounded-lg border px-3 py-2"
                    placeholder="Student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                  <input
                    className="rounded-lg border px-3 py-2"
                    placeholder="Student Name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="rounded-lg border px-3 py-2"
                    placeholder="Program"
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    required
                  />
                  <input
                    type="date"
                    className="rounded-lg border px-3 py-2"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                  />
                </div>
                <input
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="Certificate Name"
                  value={certificateName}
                  onChange={(e) => setCertificateName(e.target.value)}
                  required
                />
                <input
                  type="file"
                  accept="image/*"
                  className="w-full rounded-lg border px-3 py-2"
                  onChange={(e) => setIssueImage(e.target.files?.[0] || null)}
                  required
                />
                {issueImage && (
                  <img
                    src={URL.createObjectURL(issueImage)}
                    alt="Preview"
                    className="mt-2 h-32 object-contain border rounded"
                  />
                )}
                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={issueLoading}
                    className="rounded-lg bg-[#4FB7B3] px-6 py-2 text-white font-medium disabled:opacity-60"
                  >
                    {issueLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Issuing...
                      </span>
                    ) : (
                      "Issue Certificate"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStudentReg("");
                      setStudentId("");
                      setStudentName("");
                      setProgram("");
                      setCertificateName("");
                      setIssueDate("");
                      setIssueImage(null);
                      setIssueResult(null);
                    }}
                    className="rounded-lg border px-4 py-2 text-[#10375C] bg-white/60"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Issued Certificates */}
          {activeTab === "list" && (
            <div>
              <h1 className="mb-6 text-2xl font-bold text-[#10375C]">Issued Certificates</h1>
              {loadingCerts ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading certificates...
                </div>
              ) : certs.length === 0 ? (
                <p className="text-gray-600">No certificates issued yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#4FB7B3]/40 bg-white shadow">
                  <table className="w-full text-sm text-left text-[#10375C]">
                    <thead className="bg-[#4FB7B3]/10 font-medium">
                      <tr>
                        <th className="px-4 py-3">Certificate</th>
                        <th className="px-4 py-3">Student Name</th>
                        <th className="px-4 py-3">Program</th>
                        <th className="px-4 py-3">Blockchain Tx</th>
                        <th className="px-4 py-3">Image</th>
                        <th className="px-4 py-3">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {certs.map((c) => (
                        <tr key={c.id} className="border-t hover:bg-[#F4F6FF]">
                          <td className="px-4 py-2">{c.certificate_name}</td>
                          <td className="px-4 py-2">{c.payload?.student_name ?? "—"}</td>
                          <td className="px-4 py-2">{c.payload?.program ?? "—"}</td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {c.blockchain_tx ? c.blockchain_tx : "—"}
                          </td>
                          <td className="px-4 py-2">
                            {c.image_url && (
                              <img
                                src={c.image_url}
                                alt={c.certificate_name}
                                className="h-12 object-contain border rounded"
                              />
                            )}
                          </td>
                          <td className="px-4 py-2">{formatDate(c.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Students List */}
          {activeTab === "students" && (
            <div>
              <h1 className="mb-6 text-2xl font-bold text-[#10375C]">Students List</h1>
              {loadingStudents ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading students...
                </div>
              ) : students.length === 0 ? (
                <p className="text-gray-600">No students found.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#4FB7B3]/40 bg-white shadow">
                  <table className="w-full text-sm text-left text-[#10375C]">
                    <thead className="bg-[#4FB7B3]/10 font-medium">
                      <tr>
                        <th className="px-4 py-3">Reg Number</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Program</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.id} className="border-t hover:bg-[#F4F6FF]">
                          <td className="px-4 py-2">{s.reg_number}</td>
                          <td className="px-4 py-2">{s.name}</td>
                          <td className="px-4 py-2">{s.program}</td>
                          <td className="px-4 py-2">{s.email}</td>
                          <td className="px-4 py-2">
                            {s.is_active ? (
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
                            {s.is_active ? (
                              <button
                                onClick={() => toggleStudentStatus(s.id, true)}
                                className="rounded px-3 py-1 text-white bg-[#EB8317]"
                              >
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleStudentStatus(s.id, false)}
                                className="rounded px-3 py-1 text-white bg-[#10375C]"
                              >
                                Activate
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Add Student */}
          {activeTab === "addStudent" && (
            <div>
              <h1 className="mb-6 text-2xl font-bold text-[#10375C]">Add Student</h1>
              <form onSubmit={onAddStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Reg Number"
                    value={newRegNumber}
                    onChange={(e) => setNewRegNumber(e.target.value)}
                    required
                  />
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                  <input
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Program"
                    value={newProgram}
                    onChange={(e) => setNewProgram(e.target.value)}
                    required
                  />
                  <input
                    type="email"
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    className="w-full rounded-lg border px-3 py-2"
                    placeholder="Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={addingStudent}
                    className="rounded-lg bg-[#4FB7B3] px-6 py-2 text-white font-medium disabled:opacity-60"
                  >
                    {addingStudent ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                      </span>
                    ) : (
                      "Add Student"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewRegNumber("");
                      setNewName("");
                      setNewProgram("");
                      setNewEmail("");
                      setNewPassword("");
                    }}
                    className="rounded-lg border px-4 py-2 text-[#10375C] bg-white/60"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
