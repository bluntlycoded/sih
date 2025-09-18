import api from "./client";

export type Certificate = {
  id: string;
  institution_id: string;
  student_id: string;
  sha256_hash: string;
  signature: string;
  status: string;
  created_at: string;
  pdf_url?: string | null;
  blockchain_tx?: string | null;
  institution_name?: string | null;
  verification_status?: "VERIFIED" | "INVALID";
  reason?: string | null;
  share_url?: string;
};

export async function getMyCertificates(): Promise<Certificate[]> {
  const { data } = await api.get<Certificate[]>("/student/certificates");
  return data;
}
