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
