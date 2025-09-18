import React, { useEffect, useState } from "react";
import { getMyCertificates } from "../api/student";
import type { Certificate } from "../api/student";

export default function StudentDashboard() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyCertificates().then(setItems).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-2xl font-bold">My Certificates</h1>
      {loading && <div>Loading…</div>}
      {!loading && items.length === 0 && <div>No certificates yet.</div>}
      <div className="space-y-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-lg border p-4">
            <div className="font-semibold">
              {c.institution_name || c.institution_id} • {c.id}
            </div>
            <div className="text-sm text-gray-600">
              Issued: {c.created_at || "-"}
            </div>
            <div className="mt-1 text-sm">
              Status:{" "}
              <span
                className={`font-semibold ${
                  c.verification_status === "VERIFIED"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {c.verification_status || c.status}
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              {c.share_url && (
                <>
                  <a
                    className="rounded bg-blue-600 px-3 py-1 text-white"
                    href={c.share_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Link
                  </a>
                  <button
                    className="rounded bg-gray-200 px-3 py-1"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `Verify my certificate: ${c.share_url}`
                      )
                    }
                  >
                    Copy Share Link
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
