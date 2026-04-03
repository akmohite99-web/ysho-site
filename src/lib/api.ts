const BASE = "/api";

const getToken = () => localStorage.getItem("ysho_token");

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  login: (data: LoginPayload) =>
    fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  me: () =>
    fetch(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((res) => res.json()),
};
