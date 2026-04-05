import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ShoppingBag, LogOut, IndianRupee, TrendingUp, Package, Pencil, Check, X, Plus, Trash2, Tag, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, productApi, couponApi, Product } from "@/lib/api";
import { Input } from "@/components/ui/input";
import yshoLogo from "@/assets/ysho-logo.jpeg";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
  createdAt: string;
}

interface OrderItem {
  productId: string;
  name: string;
  variant: string;
  price: number;
  quantity: number;
}

interface AdminOrder {
  _id: string;
  userId: { name: string; email: string; phone?: string } | null;
  items: OrderItem[];
  address: { fullName: string; city: string; state: string; pincode: string };
  amount: number;
  status: string;
  trackingNumber?: string | null;
  createdAt: string;
}

interface AdminCoupon {
  _id: string;
  code: string;
  discountPercent: number;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800",
  paid:       "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped:    "bg-indigo-100 text-indigo-800",
  delivered:  "bg-green-100 text-green-800",
  failed:     "bg-red-100 text-red-800",
  cancelled:  "bg-gray-100 text-gray-600",
};

const ORDER_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "failed", "cancelled"];

// ── helpers ──────────────────────────────────────────────────────────────────
const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"];

const startOf = (unit: "day" | "month") => {
  const d = new Date();
  if (unit === "day") { d.setHours(0, 0, 0, 0); }
  else { d.setDate(1); d.setHours(0, 0, 0, 0); }
  return d;
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

// ── stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  iconBg?: string;
}
const StatCard = ({ icon, label, value, sub, iconBg = "bg-golden/10" }: StatCardProps) => (
  <Card className="border-border/50">
    <CardContent className="flex items-center gap-4 pt-6">
      <div className={`p-3 rounded-full ${iconBg} shrink-0`}>{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </CardContent>
  </Card>
);

// ── main ──────────────────────────────────────────────────────────────────────
const Admin = () => {
  const { logout } = useAuth();
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingUsers, setLoadingUsers]   = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");

  // ── coupons state ──────────────────────────────────────────────────────────
  const [coupons, setCoupons]             = useState<AdminCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [couponForm, setCouponForm]       = useState({ code: "", discountPercent: "", usageLimit: "", expiresAt: "" });
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponFormError, setCouponFormError] = useState("");
  const [editCouponId, setEditCouponId]   = useState<string | null>(null);
  const [editCouponDiscount, setEditCouponDiscount] = useState("");

  // ── products state ─────────────────────────────────────────────────────────
  const [products, setProducts]           = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [editFields, setEditFields]       = useState<{ name: string; variant: string; price: string; image: string }>({ name: "", variant: "", price: "", image: "" });
  const [newProduct, setNewProduct]       = useState({ name: "", variant: "", price: "", image: "" });
  const [showAddForm, setShowAddForm]     = useState(false);
  const [productError, setProductError]   = useState("");

  useEffect(() => {
    adminApi.getUsers()
      .then((d) => { if (d.success) setUsers(d.users); else setError(d.message); })
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoadingUsers(false));

    adminApi.getOrders()
      .then((d) => { if (d.success) setOrders(d.orders); else setError(d.message); })
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoadingOrders(false));

    productApi.adminList()
      .then((d) => { if (d.success) setProducts(d.products); })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));

    couponApi.adminList()
      .then((d) => { if (d.success) setCoupons(d.coupons); })
      .catch(() => {})
      .finally(() => setLoadingCoupons(false));
  }, []);

  // ── product handlers ───────────────────────────────────────────────────────
  const startEdit = (p: Product) => {
    setEditingId(p._id);
    setEditFields({ name: p.name, variant: p.variant, price: String(p.price), image: p.image });
    setProductError("");
  };

  const cancelEdit = () => { setEditingId(null); setProductError(""); };

  const saveEdit = async (id: string) => {
    const price = Number(editFields.price);
    if (!editFields.name || !editFields.variant || isNaN(price) || price < 0) {
      setProductError("Name, variant and a valid price are required.");
      return;
    }
    const res = await productApi.update(id, { name: editFields.name, variant: editFields.variant, price, image: editFields.image });
    if (res.success) {
      setProducts((prev) => prev.map((p) => (p._id === id ? res.product : p)));
      setEditingId(null);
    } else {
      setProductError(res.message || "Update failed.");
    }
  };

  const toggleActive = async (p: Product) => {
    const res = await productApi.update(p._id, { isActive: !p.isActive });
    if (res.success) setProducts((prev) => prev.map((x) => (x._id === p._id ? res.product : x)));
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    const res = await productApi.delete(id);
    if (res.success) setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const addProduct = async () => {
    const price = Number(newProduct.price);
    if (!newProduct.name || !newProduct.variant || isNaN(price) || price < 0) {
      setProductError("Name, variant and a valid price are required.");
      return;
    }
    const res = await productApi.create({ name: newProduct.name, variant: newProduct.variant, price, image: newProduct.image });
    if (res.success) {
      setProducts((prev) => [...prev, res.product]);
      setNewProduct({ name: "", variant: "", price: "", image: "" });
      setShowAddForm(false);
      setProductError("");
    } else {
      setProductError(res.message || "Create failed.");
    }
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    const result = await adminApi.updateOrderStatus(orderId, status);
    if (result.success) {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    }
  };

  // ── tracking handlers ──────────────────────────────────────────────────────
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  const handleSetTracking = async (orderId: string) => {
    const num = (trackingInputs[orderId] ?? "").trim();
    const res = await adminApi.setTrackingNumber(orderId, num);
    if (res.success) {
      setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, trackingNumber: res.order.trackingNumber } : o));
      setTrackingInputs((p) => ({ ...p, [orderId]: "" }));
    }
  };

  // ── coupon handlers ────────────────────────────────────────────────────────
  const createCoupon = async () => {
    const pct = Number(couponForm.discountPercent);
    if (!couponForm.code || !pct || pct < 1 || pct > 100) {
      setCouponFormError("Code and a discount % (1–100) are required.");
      return;
    }
    const res = await couponApi.create({
      code:            couponForm.code,
      discountPercent: pct,
      usageLimit:      couponForm.usageLimit ? Number(couponForm.usageLimit) : null,
      expiresAt:       couponForm.expiresAt  || null,
    });
    if (res.success) {
      setCoupons((p) => [res.coupon, ...p]);
      setCouponForm({ code: "", discountPercent: "", usageLimit: "", expiresAt: "" });
      setShowCouponForm(false);
      setCouponFormError("");
    } else {
      setCouponFormError(res.message || "Failed to create coupon.");
    }
  };

  const saveCouponDiscount = async (id: string) => {
    const pct = Number(editCouponDiscount);
    if (!pct || pct < 1 || pct > 100) return;
    const res = await couponApi.update(id, { discountPercent: pct });
    if (res.success) {
      setCoupons((p) => p.map((c) => (c._id === id ? res.coupon : c)));
      setEditCouponId(null);
    }
  };

  const toggleCoupon = async (c: AdminCoupon) => {
    const res = await couponApi.update(c._id, { isActive: !c.isActive });
    if (res.success) setCoupons((p) => p.map((x) => (x._id === c._id ? res.coupon : x)));
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    const res = await couponApi.delete(id);
    if (res.success) setCoupons((p) => p.filter((c) => c._id !== id));
  };

  // ── derived stats ─────────────────────────────────────────────────────────
  const paidOrders     = orders.filter((o) => PAID_STATUSES.includes(o.status));
  const totalRevenue   = paidOrders.reduce((s, o) => s + o.amount, 0);
  const avgOrderValue  = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0;

  const todayStart     = startOf("day");
  const monthStart     = startOf("month");
  const revenueToday   = paidOrders.filter((o) => new Date(o.createdAt) >= todayStart).reduce((s, o) => s + o.amount, 0);
  const revenueMonth   = paidOrders.filter((o) => new Date(o.createdAt) >= monthStart).reduce((s, o) => s + o.amount, 0);
  const ordersToday    = orders.filter((o) => new Date(o.createdAt) >= todayStart).length;
  const newUsersMonth  = users.filter((u) => new Date(u.createdAt) >= monthStart).length;

  // orders by status count
  const statusCount = ORDER_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  // top products by quantity
  const productMap: Record<string, { name: string; variant: string; qty: number; revenue: number }> = {};
  orders.forEach((o) => {
    if (!PAID_STATUSES.includes(o.status)) return;
    o.items.forEach((item) => {
      const key = `${item.name}__${item.variant}`;
      if (!productMap[key]) productMap[key] = { name: item.name, variant: item.variant, qty: 0, revenue: 0 };
      productMap[key].qty     += item.quantity;
      productMap[key].revenue += item.price * item.quantity;
    });
  });
  const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // users with at least one order
  const buyerIds = new Set(orders.map((o) => o.userId?.email));
  const conversionRate = users.length ? Math.round((buyerIds.size / users.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-golden/10 flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={yshoLogo} alt="Ysho Logo" className="h-10 w-auto rounded-full" />
          <span className="text-xl font-bold text-golden">Ysho Admin</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {/* ── Stats row 1 ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            icon={<IndianRupee className="w-6 h-6 text-golden" />}
            label="Total Revenue"
            value={fmt(totalRevenue)}
            sub={`This month: ${fmt(revenueMonth)}`}
          />
          <StatCard
            icon={<ShoppingBag className="w-6 h-6 text-golden" />}
            label="Total Orders"
            value={orders.length}
            sub={`Today: ${ordersToday}`}
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-golden" />}
            label="Total Users"
            value={users.length}
            sub={`New this month: ${newUsersMonth}`}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-golden" />}
            label="Avg Order Value"
            value={fmt(avgOrderValue)}
            sub={`Today's revenue: ${fmt(revenueToday)}`}
          />
        </div>

        {/* ── Stats row 2 ── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Order status breakdown */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-golden" /> Orders by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {ORDER_STATUSES.map((s) => (
                  <div key={s} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[s]}`}>
                    <span className="capitalize">{s}</span>
                    <span className="font-bold">{statusCount[s]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top products */}
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-golden" /> Top Products (by qty sold)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No paid orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="truncate">
                        <span className="text-muted-foreground mr-1">#{i + 1}</span>
                        {p.name}{" "}
                        <span className="text-xs text-muted-foreground">({p.variant})</span>
                      </span>
                      <div className="flex gap-3 shrink-0 ml-2 text-xs text-muted-foreground">
                        <span>{p.qty} units</span>
                        <span className="text-golden font-medium">{fmt(p.revenue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Conversion note ── */}
        <p className="text-xs text-muted-foreground mb-6">
          User conversion rate: <strong>{conversionRate}%</strong> ({buyerIds.size} of {users.length} users have placed an order)
        </p>

        {/* ── Tabs ── */}
        <Tabs defaultValue="orders">
          <TabsList className="mb-6">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShoppingBag className="w-5 h-5 text-golden" />
                  All Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingOrders ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-4 border-golden border-t-transparent animate-spin" />
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No orders yet.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border border-border/40 rounded-lg p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-semibold text-sm">
                              {order.userId?.name ?? "Deleted user"}{" "}
                              <span className="text-muted-foreground font-normal">
                                &lt;{order.userId?.email}&gt;
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {order.address.city}, {order.address.state} · {new Date(order.createdAt).toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-muted-foreground">Order ID: {order._id}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-golden">{fmt(order.amount)}</span>
                            <Select
                              value={order.status}
                              onValueChange={(val) => handleStatusChange(order._id, val)}
                            >
                              <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ORDER_STATUSES.map((s) => (
                                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Badge className={`text-xs capitalize ${STATUS_COLORS[order.status] ?? ""}`}>
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                        <Separator className="my-2" />
                        {/* Tracking number */}
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {order.trackingNumber ? (
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-xs font-mono text-golden font-medium">{order.trackingNumber}</span>
                              <button
                                className="text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setTrackingInputs((p) => ({ ...p, [order._id]: order.trackingNumber ?? "" }));
                                  setOrders((prev) => prev.map((o) => o._id === order._id ? { ...o, trackingNumber: null } : o));
                                  adminApi.setTrackingNumber(order._id, "");
                                }}
                              >remove</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 flex-1">
                              <Input
                                className="h-6 text-xs flex-1 font-mono"
                                placeholder="India Post consignment no."
                                value={trackingInputs[order._id] ?? ""}
                                onChange={(e) => setTrackingInputs((p) => ({ ...p, [order._id]: e.target.value.toUpperCase() }))}
                                onKeyDown={(e) => e.key === "Enter" && handleSetTracking(order._id)}
                              />
                              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => handleSetTracking(order._id)}>
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-xs text-muted-foreground">
                              <span>{item.name} ({item.variant}) × {item.quantity}</span>
                              <span>{fmt(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="w-5 h-5 text-golden" />
                  Registered Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-4 border-golden border-t-transparent animate-spin" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No users yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground text-left">
                          <th className="pb-2 font-medium">Name</th>
                          <th className="pb-2 font-medium">Email</th>
                          <th className="pb-2 font-medium">Phone</th>
                          <th className="pb-2 font-medium">Role</th>
                          <th className="pb-2 font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {users.map((u) => (
                          <tr key={u._id} className="hover:bg-muted/30">
                            <td className="py-2.5 pr-4 font-medium">{u.name}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{u.email}</td>
                            <td className="py-2.5 pr-4 text-muted-foreground">{u.phone || "—"}</td>
                            <td className="py-2.5 pr-4">
                              {u.isAdmin ? (
                                <Badge className="bg-golden/20 text-golden text-xs">Admin</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">User</Badge>
                              )}
                            </td>
                            <td className="py-2.5 text-muted-foreground">
                              {new Date(u.createdAt).toLocaleDateString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="border-border/50">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Package className="w-5 h-5 text-golden" />
                  Products
                </CardTitle>
                <Button size="sm" variant="golden" className="gap-1.5" onClick={() => { setShowAddForm((v) => !v); setProductError(""); }}>
                  <Plus className="w-4 h-4" />
                  Add Product
                </Button>
              </CardHeader>
              <CardContent>
                {productError && (
                  <p className="text-sm text-destructive mb-3">{productError}</p>
                )}

                {/* Add form */}
                {showAddForm && (
                  <div className="mb-4 p-4 border border-border/40 rounded-lg space-y-3">
                    <p className="text-sm font-medium">New Product</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
                      <Input placeholder="Variant (e.g. 500ml)" value={newProduct.variant} onChange={(e) => setNewProduct((p) => ({ ...p, variant: e.target.value }))} />
                      <Input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} />
                      <Input placeholder="Image URL (optional)" value={newProduct.image} onChange={(e) => setNewProduct((p) => ({ ...p, image: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="golden" onClick={addProduct}><Check className="w-4 h-4 mr-1" /> Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowAddForm(false); setProductError(""); }}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                    </div>
                  </div>
                )}

                {loadingProducts ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-4 border-golden border-t-transparent animate-spin" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No products yet. Add one above.</p>
                ) : (
                  <div className="space-y-3">
                    {products.map((p) => (
                      <div key={p._id} className={`border rounded-lg p-4 ${p.isActive ? "border-border/40" : "border-border/20 opacity-60"}`}>
                        {editingId === p._id ? (
                          <div className="space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <Input placeholder="Name" value={editFields.name} onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))} />
                              <Input placeholder="Variant" value={editFields.variant} onChange={(e) => setEditFields((f) => ({ ...f, variant: e.target.value }))} />
                              <Input type="number" placeholder="Price (₹)" value={editFields.price} onChange={(e) => setEditFields((f) => ({ ...f, price: e.target.value }))} />
                              <Input placeholder="Image URL" value={editFields.image} onChange={(e) => setEditFields((f) => ({ ...f, image: e.target.value }))} />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="golden" onClick={() => saveEdit(p._id)}><Check className="w-4 h-4 mr-1" /> Save</Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              {p.image && (
                                <img src={p.image} alt={p.name} className="w-12 h-12 object-contain rounded border border-border/30 bg-cream" />
                              )}
                              <div>
                                <p className="font-medium">{p.name}</p>
                                <p className="text-sm text-muted-foreground">{p.variant}</p>
                                <p className="text-lg font-bold text-golden">₹{p.price.toLocaleString("en-IN")}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                className={`text-xs cursor-pointer ${p.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                                onClick={() => toggleActive(p)}
                              >
                                {p.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Button size="sm" variant="ghost" onClick={() => startEdit(p)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => deleteProduct(p._id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Coupons Tab */}
          <TabsContent value="coupons">
            <Card className="border-border/50">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Tag className="w-5 h-5 text-golden" />
                  Coupon Codes
                </CardTitle>
                <Button size="sm" variant="golden" className="gap-1.5" onClick={() => { setShowCouponForm((v) => !v); setCouponFormError(""); }}>
                  <Plus className="w-4 h-4" />
                  New Coupon
                </Button>
              </CardHeader>
              <CardContent>
                {couponFormError && <p className="text-sm text-destructive mb-3">{couponFormError}</p>}

                {showCouponForm && (
                  <div className="mb-4 p-4 border border-border/40 rounded-lg space-y-3">
                    <p className="text-sm font-medium">Create Coupon</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Code (e.g. SAVE10)"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                        className="uppercase"
                      />
                      <Input
                        type="number" min="1" max="100"
                        placeholder="Discount % (1–100)"
                        value={couponForm.discountPercent}
                        onChange={(e) => setCouponForm((f) => ({ ...f, discountPercent: e.target.value }))}
                      />
                      <Input
                        type="number" min="1"
                        placeholder="Usage limit (leave blank = unlimited)"
                        value={couponForm.usageLimit}
                        onChange={(e) => setCouponForm((f) => ({ ...f, usageLimit: e.target.value }))}
                      />
                      <Input
                        type="date"
                        placeholder="Expiry date (optional)"
                        value={couponForm.expiresAt}
                        onChange={(e) => setCouponForm((f) => ({ ...f, expiresAt: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="golden" onClick={createCoupon}><Check className="w-4 h-4 mr-1" /> Create</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setShowCouponForm(false); setCouponFormError(""); }}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                    </div>
                  </div>
                )}

                {loadingCoupons ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 rounded-full border-4 border-golden border-t-transparent animate-spin" />
                  </div>
                ) : coupons.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">No coupons yet. Create one above.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground text-left">
                          <th className="pb-2 font-medium">Code</th>
                          <th className="pb-2 font-medium">Discount</th>
                          <th className="pb-2 font-medium">Used / Limit</th>
                          <th className="pb-2 font-medium">Expires</th>
                          <th className="pb-2 font-medium">Status</th>
                          <th className="pb-2 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {coupons.map((c) => (
                          <tr key={c._id} className={`hover:bg-muted/30 ${!c.isActive ? "opacity-50" : ""}`}>
                            <td className="py-2.5 pr-4 font-mono font-semibold">{c.code}</td>
                            <td className="py-2.5 pr-4">
                              {editCouponId === c._id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number" min="1" max="100"
                                    className="h-7 w-20 text-xs"
                                    value={editCouponDiscount}
                                    onChange={(e) => setEditCouponDiscount(e.target.value)}
                                  />
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => saveCouponDiscount(c._id)}><Check className="w-3 h-3" /></Button>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditCouponId(null)}><X className="w-3 h-3" /></Button>
                                </div>
                              ) : (
                                <span className="font-medium text-golden">{c.discountPercent}%</span>
                              )}
                            </td>
                            <td className="py-2.5 pr-4 text-muted-foreground">
                              {c.usedCount} / {c.usageLimit ?? "∞"}
                            </td>
                            <td className="py-2.5 pr-4 text-muted-foreground">
                              {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                            </td>
                            <td className="py-2.5 pr-4">
                              <Badge
                                className={`text-xs cursor-pointer ${c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                                onClick={() => toggleCoupon(c)}
                              >
                                {c.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="py-2.5">
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditCouponId(c._id); setEditCouponDiscount(String(c.discountPercent)); }}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => deleteCoupon(c._id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/30">
        &copy; {new Date().getFullYear()} Ysho Admin Panel
      </footer>
    </div>
  );
};

export default Admin;
