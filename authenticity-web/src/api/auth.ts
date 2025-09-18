import api from "./client";

export type LoginResp = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export async function login(email: string, password: string): Promise<LoginResp> {
  const { data } = await api.post<LoginResp>("/auth/login", { email, password });
  return data;
}

export async function refreshToken(refresh: string): Promise<LoginResp> {
  const { data } = await api.post<LoginResp>("/auth/refresh", { refresh_token: refresh });
  return data;
}
