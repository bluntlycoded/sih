import api from "./client";

export async function verifyById(certId: string) {
  const { data } = await api.get(`/verify/${certId}`);
  return data as any;
}
