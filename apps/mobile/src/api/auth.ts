import { api, setToken, clearToken } from "./client";
import type { User } from "@/types";

interface LoginResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>("/api/mobile/auth/login", { email, password });
  await setToken(data.token);
  return data;
}

export async function register(email: string, password: string, name: string): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>("/api/mobile/auth/register", { email, password, name });
  await setToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  await clearToken();
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post("/api/auth/forgot-password", { email });
}

export async function getMe(): Promise<User> {
  return api.get<User>("/api/mobile/auth/me");
}
