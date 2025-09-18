import api from "./client";

// -------------------- Types --------------------
export interface CertificateOut {
  id: string;
  institution_id: string;
  student_id: string;
  sha256_hash: string;
  signature: string;
  status: string;
  payload?: Record<string, any>;   // ✅ added payload
  pdf_url?: string | null;
  blockchain_tx?: string | null;
  created_at: string;
}

export interface IssueCertificateParams {
  student_id: string;
  payload: Record<string, any>;
  signature_b64: string; // in your jugaad: equals institution_id
}

export interface StudentOut {
  id: string;
  reg_number: string;
  name: string;
  program: string;
  email: string;
  institution_id: string;
  created_at?: string;
}

export interface StudentCreate {
  reg_number: string;
  name: string;
  program: string;
  email: string;
}

// -------------------- Certificate APIs --------------------
/**
 * Issue a certificate (POST /issuer/certificates)
 */
export async function issueCertificate(
  params: IssueCertificateParams
): Promise<CertificateOut> {
  const { data } = await api.post("/issuer/certificates", params);
  return data;
}

/**
 * List all certificates issued by the current university (GET /issuer/certificates)
 */
export async function listIssued(): Promise<CertificateOut[]> {
  const { data } = await api.get("/issuer/certificates");
  return data;
}

// -------------------- Student APIs --------------------
/**
 * List all students (GET /issuer/students)
 */
export async function listStudents(): Promise<StudentOut[]> {
  const { data } = await api.get("/issuer/students");
  return data;
}

/**
 * Add a new student (POST /issuer/students)
 */
export async function addStudent(params: StudentCreate): Promise<StudentOut> {
  const { data } = await api.post("/issuer/students", params);
  return data;
}

/**
 * Get student details by registration number (GET /issuer/students/{reg_number})
 */
export async function getStudentByReg(reg_number: string): Promise<StudentOut> {
  const { data } = await api.get(`/issuer/students/${reg_number}`);
  return data;
}
