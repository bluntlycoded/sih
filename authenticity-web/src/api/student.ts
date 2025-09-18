// src/api/student.ts
import api from "./client";

export type Certificate = {
  id: string;
  institution_id: string;
  student_id: string;
  sha256_hash: string;
  signature: string;
  status: string;
  payload?: Record<string, any>; // contains program, student_name, issue_date, etc.
  created_at: string;
  pdf_url?: string | null;
  blockchain_tx?: string | null;

  // Extra fields added by backend (student.py + university.py)
  institution_name?: string | null;
  verification_status?: "VERIFIED" | "INVALID";
  reason?: string | null;
  share_url?: string;

  // ✅ new fields (University now issues with these)
  certificate_name?: string;
  image_url?: string;
};

export async function getMyCertificates(): Promise<Certificate[]> {
  const { data } = await api.get<Certificate[]>("/student/certificates");
  return data;
}
