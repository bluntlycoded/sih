import api from "./client";

export async function issueCertificate(params: {
  student_id: string;
  payload: Record<string, any>;
  signature_b64: string; // in your jugaad: equals institution_id
}) {
  const { data } = await api.post("/issuer/certificates", params);
  return data;
}

export async function listIssued() {
  const { data } = await api.get("/issuer/certificates");
  return data;
}
