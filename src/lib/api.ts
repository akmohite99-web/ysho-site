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

  verifyEmail: (email: string, code: string) =>
    fetch(`${BASE}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    }).then((res) => res.json()),

  resendCode: (email: string) =>
    fetch(`${BASE}/auth/resend-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then((res) => res.json()),

  forgotPassword: (email: string) =>
    fetch(`${BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then((res) => res.json()),

  resetPassword: (email: string, code: string, newPassword: string) =>
    fetch(`${BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
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
  create: (data: { items: OrderItem[]; address: OrderAddress; couponCode?: string | null }) =>
    fetch(`${BASE}/orders/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    }).then((res) => res.json()),

  submitUtr: (orderId: string, utrNumber: string) =>
    fetch(`${BASE}/orders/${orderId}/utr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ utrNumber }),
    }).then((res) => res.json()),

  getById: (id: string) =>
    fetch(`${BASE}/orders/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((res) => res.json()),

  myOrders: () =>
    fetch(`${BASE}/orders/my`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((res) => res.json()),

  getTracking: (id: string) =>
    fetch(`${BASE}/orders/${id}/tracking`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((r) => r.json()),
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

export interface ProductVariant {
  size: string;
  price: number;
  isActive: boolean;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  image: string;
  variants: ProductVariant[];
  isActive: boolean;
}

export const couponApi = {
  validate: (code: string) =>
    fetch(`${BASE}/coupons/validate`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ code }),
    }).then((r) => r.json()),

  adminList: () =>
    fetch(`${BASE}/admin/coupons`, { headers: authHeader() }).then((r) => r.json()),

  create: (data: { code: string; discountPercent: number; usageLimit?: number | null; expiresAt?: string | null }) =>
    fetch(`${BASE}/admin/coupons`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  update: (id: string, data: Partial<{ discountPercent: number; isActive: boolean; usageLimit: number | null; expiresAt: string | null }>) =>
    fetch(`${BASE}/admin/coupons/${id}`, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  delete: (id: string) =>
    fetch(`${BASE}/admin/coupons/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }).then((r) => r.json()),
};

export const productApi = {
  list: () =>
    fetch(`${BASE}/products`).then((r) => r.json()),

  adminList: () =>
    fetch(`${BASE}/admin/products`, { headers: authHeader() }).then((r) => r.json()),

  create: (data: { name: string; description?: string; variants?: { size: string; price: number; isActive: boolean }[]; image?: string }) =>
    fetch(`${BASE}/admin/products`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  update: (id: string, data: Partial<{ name: string; variant: string; price: number; image: string; isActive: boolean }>) =>
    fetch(`${BASE}/admin/products/${id}`, {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  updateVariant: (id: string, size: string, data: { price?: number; isActive?: boolean }) =>
    fetch(`${BASE}/admin/products/${id}/variant`, {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ size, ...data }),
    }).then((r) => r.json()),

  delete: (id: string) =>
    fetch(`${BASE}/admin/products/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }).then((r) => r.json()),
};

export const adApi = {
  generate: (data: { productName: string; platform: string; tone: string; context?: string }) =>
    fetch(`${BASE}/admin/generate-ad`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  generateImage: (data: { productName: string; productId?: string; platform: string; tone: string; context?: string; overridePrompt?: string }) =>
    fetch(`${BASE}/admin/generate-ad-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
};

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

  setTrackingNumber: (id: string, trackingNumber: string) =>
    fetch(`${BASE}/admin/orders/${id}/tracking`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ trackingNumber }),
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
