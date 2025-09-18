import api from "./client";

export type Role = "ADMIN" | "UNIVERSITY" | "STUDENT";

// ---------- Users ----------
export async function createUser(params: {
  email: string;
  password: string;
  role: Role;
  institution_id?: string | null;
}) {
  const { data } = await api.post("/admin/users", params);
  return data;
}

export async function listUsers() {
  const { data } = await api.get("/admin/users");
  return data;
}

export async function activateUser(userId: string) {
  const { data } = await api.post(`/admin/users/${userId}/activate`);
  return data;
}

export async function deactivateUser(userId: string) {
  const { data } = await api.post(`/admin/users/${userId}/deactivate`);
  return data;
}

export async function updateUserRole(userId: string, role: Role) {
  const { data } = await api.put(`/admin/users/${userId}/role`, { role });
  return data;
}

// ---------- Institutions ----------
export async function createInstitution(params: {
  name: string;
  public_key_pem: string;
}) {
  const { data } = await api.post("/admin/institutions", params);
  return data;
}

export async function listInstitutions() {
  const { data } = await api.get("/admin/institutions");
  return data;
}

export async function approveInstitution(instId: string) {
  const { data } = await api.post(`/admin/institutions/${instId}/approve`);
  return data;
}

export async function revokeInstitution(instId: string) {
  const { data } = await api.post(`/admin/institutions/${instId}/revoke`);
  return data;
}

export async function updateInstitutionKey(instId: string, public_key_pem: string) {
  const { data } = await api.put(`/admin/institutions/${instId}/key`, { public_key_pem });
  return data;
}
