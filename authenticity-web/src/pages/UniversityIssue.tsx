import React, { useState } from "react";
import { issueCertificate } from "../api/university";
import TextArea from "../components/TextArea";

export default function UniversityIssue() {
  const [studentId, setStudentId] = useState("");
  const [payload, setPayload] = useState(`{
  "student_name": "Alice",
  "program": "B.Tech",
  "issue_date": "2025-09-18"
}`);
  const [institutionId, setInstitutionId] = useState("9c0a5c44-98e0-4b0c-a4a9-f4e6fb31fc4d");
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function onIssue(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const parsed = JSON.parse(payload);
      const data = await issueCertificate({
        student_id: studentId,
        payload: parsed,
        signature_b64: institutionId,
      });
      setRes(data);
      alert("✅ Certificate issued successfully!");
    } catch {
      alert("❌ Issue failed. Check JSON & inputs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        University Panel <span className="text-indigo-600">• Issue Certificate</span>
      </h1>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <form onSubmit={onIssue} className="space-y-5 p-6">
          {/* Student ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Student ID (UUID)
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              placeholder="e.g. 7e9b8f0c-12d4-4a8a-9f88-xyz..."
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </div>

          {/* Payload JSON */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Certificate Payload (JSON)
            </label>
            <TextArea
              value={payload}
              onChange={setPayload}
              rows={10}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-gray-800 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
            />
            <p className="mt-1 text-xs text-gray-500">
              Example: {"{ student_name: 'Alice', program: 'B.Tech', issue_date: '2025-09-18' }"}
            </p>
          </div>

          {/* Institution ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution ID (Signature)
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-800 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200"
              placeholder="Institution UUID"
              value={institutionId}
              onChange={(e) => setInstitutionId(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Issuing..." : "Issue Certificate"}
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
