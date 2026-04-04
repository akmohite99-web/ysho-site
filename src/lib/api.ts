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

interface OrderAddress {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface OrderItem {
  productId: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
  image: string;
}

export const orderApi = {
  create: (data: { items: OrderItem[]; address: OrderAddress }) =>
    fetch(`${BASE}/orders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  verify: (data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) =>
    fetch(`${BASE}/orders/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  getById: (id: string) =>
    fetch(`${BASE}/orders/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((res) => res.json()),

  myOrders: () =>
    fetch(`${BASE}/orders/my`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((res) => res.json()),
};

export interface SavedAddress {
  _id: string;
  label: "home" | "work" | "other";
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

type AddressPayload = Omit<SavedAddress, "_id">;

const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });
const jsonHeaders = () => ({ "Content-Type": "application/json", ...authHeader() });

export const adminApi = {
  getUsers: () =>
    fetch(`${BASE}/admin/users`, { headers: { Authorization: `Bearer ${getToken()}` } }).then((r) => r.json()),

  getOrders: () =>
    fetch(`${BASE}/admin/orders`, { headers: { Authorization: `Bearer ${getToken()}` } }).then((r) => r.json()),

  updateOrderStatus: (id: string, status: string) =>
    fetch(`${BASE}/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status }),
    }).then((r) => r.json()),
};

export const userApi = {
  getProfile: () =>
    fetch(`${BASE}/users/profile`, { headers: authHeader() }).then((r) => r.json()),

  updateProfile: (data: { name?: string; phone?: string }) =>
    fetch(`${BASE}/users/profile`, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  getAddresses: () =>
    fetch(`${BASE}/users/addresses`, { headers: authHeader() }).then((r) => r.json()),

  addAddress: (data: AddressPayload) =>
    fetch(`${BASE}/users/addresses`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  updateAddress: (id: string, data: Partial<AddressPayload>) =>
    fetch(`${BASE}/users/addresses/${id}`, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  deleteAddress: (id: string) =>
    fetch(`${BASE}/users/addresses/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }).then((r) => r.json()),

  setDefaultAddress: (id: string) =>
    fetch(`${BASE}/users/addresses/${id}/default`, {
      method: "PUT",
      headers: authHeader(),
    }).then((r) => r.json()),
};
