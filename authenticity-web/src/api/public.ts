// src/api/verify.ts
import api from "./client";

export interface VerificationResponse {
  status: "VERIFIED" | "INVALID" | "NOT FOUND";
  certificate_id: string;
  institution?: string;
  student_id?: string;
  issued_at?: string;
  reason?: string;
}

/**
 * Verify certificate by ID
 */
export async function verifyById(certId: string): Promise<VerificationResponse> {
  try {
    const { data } = await api.get(`/verify/${certId}`);
    return data as VerificationResponse;
  } catch (err: any) {
    // Extract backend error message if available
    const message =
      err?.response?.data?.detail || err?.message || "Verification by ID failed";
    throw new Error(message);
  }
}

/**
 * Verify certificate by uploading a PDF or Image
 */
export async function verifyByUpload(file: File): Promise<VerificationResponse> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const { data } = await api.post(`/verify/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data as VerificationResponse;
  } catch (err: any) {
    // Extract backend error message if available
    const message =
      err?.response?.data?.detail ||
      err?.message ||
      "Verification by upload failed";
    throw new Error(message);
  }
}
