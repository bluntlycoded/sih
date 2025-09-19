// src/pages/StudentDashboard.tsx
import { useEffect, useState } from "react";
import { getMyCertificates } from "../api/student";
import type { Certificate } from "../api/student";

export default function StudentDashboard() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  // For modal preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>("");

  useEffect(() => {
    getMyCertificates()
      .then((data) => {
        // ✅ normalize image_url to absolute
        const normalized = data.map((c) => {
          if (c.image_url && c.image_url.startsWith("/")) {
            return {
              ...c,
              image_url: `${window.location.origin}${c.image_url}`,
            };
          }
          return c;
        });
        setItems(normalized);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6FF] py-10">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#10375C]">My Certificates</h1>
          <p className="text-sm text-[#10375C]/70 mt-1">
            View, download, and share your verified certificates securely.
          </p>
        </div>

        {/* Loading / Empty */}
        {loading && (
          <div className="text-[#10375C] text-lg animate-pulse">Loading…</div>
        )}
        {!loading && items.length === 0 && (
          <div className="text-[#10375C]/80 italic">No certificates issued yet.</div>
        )}

        {/* Certificates Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-[#4FB7B3]/40 bg-white/80 backdrop-blur-md shadow-md hover:shadow-lg transition p-6 flex flex-col justify-between"
            >
              {/* Header */}
              <div>
                <div className="font-semibold text-[#10375C] text-lg">
                  {c.certificate_name || "Unnamed Certificate"}
                </div>
                <div className="text-sm text-[#10375C]/70 mt-1">
                  {c.payload?.student_name || "Unknown Student"} •{" "}
                  {c.payload?.program || "—"}
                </div>
                <div className="text-xs text-[#10375C]/50 mt-1">
                  {c.institution_name || c.institution_id}
                </div>
              </div>

              {/* Image Preview */}
              {c.image_url ? (
                <div className="mt-4">
                  <img
                    src={c.image_url}
                    alt={c.certificate_name || "Certificate"}
                    className="w-full h-40 object-contain border rounded-md cursor-pointer hover:opacity-90"
                    onClick={() => {
                      setPreviewImage(c.image_url!);
                      setPreviewTitle(c.certificate_name || "Certificate");
                    }}
                  />
                </div>
              ) : (
                <div className="mt-4 h-40 flex items-center justify-center border rounded-md text-sm text-gray-400 italic">
                  No preview available
                </div>
              )}

              {/* Meta */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="text-[#10375C]/80">
                  Issued:{" "}
                  <span className="font-medium">
                    {c.created_at
                      ? new Date(c.created_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div>
                  Status:{" "}
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md ${
                      c.verification_status === "VERIFIED"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {c.verification_status || c.status}
                  </span>
                </div>
                {c.blockchain_tx && (
                  <div className="text-[#10375C]/80 break-all">
                    Blockchain Tx:{" "}
                    <span className="font-mono text-xs">{c.blockchain_tx}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-wrap gap-3">
                {c.share_url && (
                  <a
                    href={c.share_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-center rounded-lg bg-[#4FB7B3] px-3 py-2 font-medium text-white hover:bg-[#3aa7a3] transition"
                  >
                    Open
                  </a>
                )}
                {c.share_url && (
                  <button
                    className="rounded-lg border border-[#4FB7B3]/50 px-3 py-2 text-sm text-[#10375C] hover:bg-[#F4F6FF] transition"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `Verify my certificate: ${c.share_url}`
                      )
                    }
                  >
                    Copy Link
                  </button>
                )}
                {c.pdf_url && (
                  <a
                    href={c.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[#4FB7B3]/50 px-3 py-2 text-sm text-[#10375C] hover:bg-[#F4F6FF] transition"
                  >
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Preview */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full relative">
            {/* Close button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
            {/* Title */}
            <div className="p-3 border-b text-lg font-semibold text-[#10375C]">
              {previewTitle}
            </div>
            {/* Image */}
            <div className="p-4 flex justify-center">
              <img
                src={previewImage}
                alt={previewTitle}
                className="max-h-[80vh] object-contain"
              />
            </div>
            {/* Download button inside modal */}
            <div className="p-4 border-t flex justify-end">
              <a
                href={previewImage}
                download={previewTitle.replace(/\s+/g, "_") + ".png"}
                className="rounded-lg bg-[#4FB7B3] px-4 py-2 text-white font-medium hover:bg-[#3aa7a3]"
              >
                Download Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
