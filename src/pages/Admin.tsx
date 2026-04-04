import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, ShoppingBag, LogOut, IndianRupee, TrendingUp, Package } from "lucide-react";
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
import { adminApi } from "@/lib/api";
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
  createdAt: string;
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

  useEffect(() => {
    adminApi.getUsers()
      .then((d) => { if (d.success) setUsers(d.users); else setError(d.message); })
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoadingUsers(false));

    adminApi.getOrders()
      .then((d) => { if (d.success) setOrders(d.orders); else setError(d.message); })
      .catch(() => setError("Failed to load orders."))
      .finally(() => setLoadingOrders(false));
  }, []);

  const handleStatusChange = async (orderId: string, status: string) => {
    const result = await adminApi.updateOrderStatus(orderId, status);
    if (result.success) {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status } : o)));
    }
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
        </Tabs>
      </div>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/30">
        &copy; {new Date().getFullYear()} Ysho Admin Panel
      </footer>
    </div>
  );
};

export default Admin;
