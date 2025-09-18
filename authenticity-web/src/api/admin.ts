import api from "./client";

export type Role = "ADMIN" | "UNIVERSITY" | "STUDENT";

export async function createUser(params: {
  email: string;
  password: string;
  role: Role;
  institution_id?: string | null;
}) {
  const { data } = await api.post("/admin/users", params);
  return data;
}
