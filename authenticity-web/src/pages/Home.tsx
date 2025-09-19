// src/pages/Home.tsx
import React, { useState } from "react";
import {
  ShieldCheck,
  GraduationCap,
  Building2,
  Users,
  Loader2,
  Upload,
  MessageCircle,
  X,
} from "lucide-react";
import { verifyById, verifyByUpload } from "../api/public";

export default function Home() {
  const features = [
    {
      title: "Students",
      desc: "Access and share your digitally verified academic certificates securely.",
      icon: GraduationCap,
    },
    {
      title: "Universities",
      desc: "Issue tamper-proof certificates that are trusted nationwide.",
      icon: Building2,
    },
    {
      title: "Administrators",
      desc: "Oversee institutions, user roles, and certificate policies centrally.",
      icon: Users,
    },
    {
      title: "Public Verification",
      desc: "Validate any certificate instantly with its unique identifier or upload.",
      icon: ShieldCheck,
    },
  ];

  // Verification states
  const [id, setId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Chatbot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([
    {
      role: "bot",
      text: "Hi! I’m the AI assistant. Ask me anything about certificate verification.",
    },
  ]);

  async function onVerifyById(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setRes(null);
    try {
      const data = await verifyById(id);
      setRes(data);
    } catch (err: any) {
      setRes({ error: err.message || "Verification failed." });
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyByUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setRes(null);
    try {
      const data = await verifyByUpload(file);
      setRes(data);
    } catch (err: any) {
      setRes({ error: err.message || "Upload verification failed." });
    } finally {
      setLoading(false);
    }
  }

  function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setMessages((m) => [...m, { role: "user", text: chatInput }]);

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: "I understand your query. Certificates are verified using institutional records, OCR, blockchain, and cryptographic signatures.",
        },
      ]);
    }, 600);

    setChatInput("");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6FF]">
      {/* Hero Section */}
      <header className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-4xl font-extrabold text-[#EB8317] sm:text-5xl">
          Authenticity Validator Portal
        </h2>
        <p className="mt-6 text-lg text-[#10375C] leading-relaxed">
          A trusted government-backed platform to issue, verify, and manage
          academic certificates securely across institutions.
        </p>
      </header>

      {/* Public Verification */}
      <section className="mx-auto max-w-3xl px-6 mb-20">
        <div className="rounded-2xl bg-white p-8 shadow-lg border border-gray-200">
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-[#4FB7B3]" />
            <h2 className="text-2xl font-bold text-[#10375C]">
              Public Verification
            </h2>
          </div>

          {/* Verify by ID */}
          <form onSubmit={onVerifyById} className="flex gap-3 mb-6">
            <input
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-[#10375C] placeholder-gray-400 focus:border-[#4FB7B3] focus:ring-2 focus:ring-[#4FB7B3]"
              placeholder="Certificate ID (UUID)"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center rounded-lg bg-[#4FB7B3] px-5 py-2 font-medium text-white transition hover:bg-[#3AA29E] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Check"}
            </button>
          </form>

          {/* Verify by Upload */}
          <form onSubmit={onVerifyByUpload} className="flex gap-3 mb-6">
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1 text-sm text-gray-600"
            />
            <button
              type="submit"
              disabled={loading || !file}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#4FB7B3] px-4 py-2 font-medium text-white transition hover:bg-[#3AA29E] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Upload & Verify
                </>
              )}
            </button>
          </form>

          {/* Verification Result */}
          {res && (
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#EB8317]">
                Verification Result
              </h3>
              {res.error ? (
                <p className="text-red-600">{res.error}</p>
              ) : (
                <div className="space-y-2 text-sm text-[#10375C]">
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    <span
                      className={`px-2 py-0.5 rounded ${
                        res.status === "VERIFIED"
                          ? "bg-green-100 text-green-700"
                          : res.status === "INVALID"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {res.status}
                    </span>
                  </p>
                  {res.certificate_id && (
                    <p>
                      <span className="font-semibold">Certificate ID:</span>{" "}
                      {res.certificate_id}
                    </p>
                  )}
                  {res.certificate_name && (
                    <p>
                      <span className="font-semibold">Certificate:</span>{" "}
                      {res.certificate_name}
                    </p>
                  )}
                  {res.student_name && (
                    <p>
                      <span className="font-semibold">Student:</span>{" "}
                      {res.student_name}
                    </p>
                  )}
                  {res.student_id && (
                    <p>
                      <span className="font-semibold">Student ID:</span>{" "}
                      {res.student_id}
                    </p>
                  )}
                  {res.institution && (
                    <p>
                      <span className="font-semibold">Institution:</span>{" "}
                      {res.institution}
                    </p>
                  )}
                  {res.issued_at && (
                    <p>
                      <span className="font-semibold">Issued At:</span>{" "}
                      {new Date(res.issued_at).toLocaleString()}
                    </p>
                  )}
                  {res.blockchain_tx && (
                    <p>
                      <span className="font-semibold">Blockchain Tx:</span>{" "}
                      <span className="font-mono break-all text-[#EB8317]">
                        {res.blockchain_tx}
                      </span>
                    </p>
                  )}
                  {res.reason && (
                    <p className="text-red-600">
                      <span className="font-semibold">Reason:</span>{" "}
                      {res.reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mb-16">
        {features.map((f, i) => (
          <div
            key={i}
            className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <f.icon className="h-12 w-12 text-[#4FB7B3] mb-4" />
            <h3 className="text-lg font-semibold text-[#EB8317]">{f.title}</h3>
            <p className="mt-2 text-sm text-[#10375C] leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 mb-20">
        <h2 className="text-xl font-bold text-[#EB8317] mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4 text-sm text-[#10375C]">
          <details className="rounded-lg border border-gray-200 p-3">
            <summary className="cursor-pointer font-semibold">
              Why is certificate verification important?
            </summary>
            <p className="mt-2">
              With the rise of fake degrees, a secure verification process
              ensures academic integrity and safeguards genuine achievements.
            </p>
          </details>
          <details className="rounded-lg border border-gray-200 p-3">
            <summary className="cursor-pointer font-semibold">
              How does this system detect fake certificates?
            </summary>
            <p className="mt-2">
              We use OCR, blockchain logging, database cross-checks, and cryptographic signatures to
              flag anomalies in uploaded certificate data.
            </p>
          </details>
          <details className="rounded-lg border border-gray-200 p-3">
            <summary className="cursor-pointer font-semibold">
              Can old certificates be verified?
            </summary>
            <p className="mt-2">
              Yes. Legacy certificates can be scanned and validated if
              universities have uploaded their records.
            </p>
          </details>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#4FB7B3] text-white mt-auto">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm">
          <p>
            © 2025 Government of India | Ministry of Education — All Rights
            Reserved
          </p>
          <p className="mt-1">
            Designed for secure and transparent education services.
          </p>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#4FB7B3] text-white shadow-lg hover:bg-[#3AA29E] transition"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      {chatOpen && (
        <div className="fixed bottom-20 right-6 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-2 bg-[#4FB7B3] text-white rounded-t-xl">
            <span className="font-semibold">AI Assistant</span>
            <button onClick={() => setChatOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="h-64 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[80%] ${
                  m.role === "user"
                    ? "ml-auto bg-[#F3C623] text-[#10375C]"
                    : "bg-gray-100 text-[#10375C]"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={handleChatSubmit}
            className="flex items-center border-t p-2"
          >
            <input
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#4FB7B3]"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your question..."
            />
            <button
              type="submit"
              className="ml-2 rounded-lg bg-[#4FB7B3] px-3 py-1 text-sm text-white hover:bg-[#3AA29E]"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
