import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, MapPin, ShoppingBag, Edit2, Trash2, Plus, Star,
  CheckCircle2, Clock, Truck, Package, XCircle, ChevronDown, ChevronUp,
  Home, Briefcase, MoreHorizontal, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { userApi, orderApi, type SavedAddress } from "@/lib/api";
import IndiaPostTracking from "@/components/IndiaPostTracking";
import yshoLogo from "@/assets/ysho-logo.jpeg";

// ── Types ──────────────────────────────────────────────────────────────────
interface Order {
  _id: string;
  items: { productId: string; name: string; variant: string; price: number; quantity: number }[];
  address: { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };
  amount: number;
  utrNumber?: string;
  trackingNumber?: string | null;
  status: string;
  createdAt: string;
}

// ── Order tracking steps ───────────────────────────────────────────────────
const TRACKING_STEPS = [
  { key: "pending",    label: "Order Placed",  icon: CheckCircle2 },
  { key: "paid",       label: "Payment Done",  icon: CheckCircle2 },
  { key: "processing", label: "Processing",    icon: Clock },
  { key: "shipped",    label: "Shipped",       icon: Truck },
  { key: "delivered",  label: "Delivered",     icon: Package },
];

const STATUS_ORDER = ["pending", "paid", "processing", "shipped", "delivered"];

const statusBadgeVariant = (status: string) => {
  if (status === "delivered") return "bg-ysho-green/10 text-ysho-green border-ysho-green/20";
  if (status === "shipped")   return "bg-blue-50 text-blue-600 border-blue-200";
  if (status === "paid" || status === "processing") return "bg-golden/10 text-golden border-golden/20";
  if (status === "failed" || status === "cancelled") return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground border-border";
};

// ── Address form schema ────────────────────────────────────────────────────
const addressSchema = z.object({
  label:    z.enum(["home", "work", "other"]),
  fullName: z.string().min(2, "Name required"),
  phone:    z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit mobile required"),
  line1:    z.string().min(5, "Address required"),
  line2:    z.string().optional(),
  city:     z.string().min(2, "City required"),
  state:    z.string().min(2, "State required"),
  pincode:  z.string().regex(/^\d{6}$/, "Valid 6-digit pincode required"),
  isDefault: z.boolean().optional(),
});
type AddressForm = z.infer<typeof addressSchema>;

const profileSchema = z.object({
  name:  z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().refine(
    (v) => !v || /^[6-9]\d{9}$/.test(v),
    "Enter a valid 10-digit mobile number"
  ),
});
type ProfileForm = z.infer<typeof profileSchema>;

// ── AddressDialog ──────────────────────────────────────────────────────────
const AddressDialog = ({
  open, onClose, initial, onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: SavedAddress | null;
  onSave: (data: AddressForm) => Promise<void>;
}) => {
  const [saving, setSaving] = useState(false);
  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: initial
      ? { ...initial, line2: initial.line2 || "", isDefault: initial.isDefault }
      : { label: "home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initial
          ? { ...initial, line2: initial.line2 || "", isDefault: initial.isDefault }
          : { label: "home", fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", isDefault: false }
      );
    }
  }, [open, initial]);

  const handleSubmit = async (values: AddressForm) => {
    setSaving(true);
    try { await onSave(values); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Address" : "Add New Address"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="label" render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile</FormLabel>
                  <FormControl><Input type="tel" placeholder="10-digit" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl><Input placeholder="Recipient name" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="line1" render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 1</FormLabel>
                <FormControl><Input placeholder="House/Flat, Street, Area" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="line2" render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 2 <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                <FormControl><Input placeholder="Landmark, etc." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-3 gap-4">
              {(["city", "state", "pincode"] as const).map((name) => (
                <FormField key={name} control={form.control} name={name} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{name}</FormLabel>
                    <FormControl><Input placeholder={name === "pincode" ? "6 digits" : ""} maxLength={name === "pincode" ? 6 : undefined} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input type="checkbox" {...form.register("isDefault")} className="accent-golden w-4 h-4" />
              Set as default address
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="golden" disabled={saving}>
                {saving ? "Saving…" : initial ? "Save Changes" : "Add Address"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ── OrderTracker ───────────────────────────────────────────────────────────
const OrderTracker = ({ status }: { status: string }) => {
  const currentIdx = STATUS_ORDER.indexOf(status);
  const isFailed = status === "failed" || status === "cancelled";

  if (isFailed) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm py-2">
        <XCircle className="w-5 h-5" />
        <span className="font-medium capitalize">{status}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-0 mt-3 overflow-x-auto pb-1">
      {TRACKING_STEPS.map((step, idx) => {
        const done    = idx < currentIdx;
        const active  = idx === currentIdx;
        const Icon    = step.icon;
        return (
          <div key={step.key} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                ${done   ? "bg-ysho-green border-ysho-green text-white"
                : active ? "bg-golden border-golden text-white"
                :          "bg-background border-border text-muted-foreground"}`}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] text-center w-16 leading-tight
                ${active ? "text-golden font-semibold" : done ? "text-ysho-green" : "text-muted-foreground"}`}>
                {step.label}
              </span>
            </div>
            {idx < TRACKING_STEPS.length - 1 && (
              <div className={`h-0.5 w-8 mb-4 mx-0.5 flex-shrink-0 ${idx < currentIdx ? "bg-ysho-green" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Main Profile Page ──────────────────────────────────────────────────────
const Profile = () => {
  const { user, login } = useAuth();

  // Profile state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Address state
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState<SavedAddress | null>(null);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || "", phone: user?.phone || "" },
  });

  // Load addresses + orders
  useEffect(() => {
    userApi.getAddresses().then((d) => { if (d.success) setAddresses(d.addresses); }).finally(() => setAddrLoading(false));
    orderApi.myOrders().then((d) => { if (d.success) setOrders(d.orders); }).finally(() => setOrdersLoading(false));
  }, []);

  // ── Profile save ──
  const saveProfile = async (values: ProfileForm) => {
    setProfileSaving(true);
    try {
      const data = await userApi.updateProfile(values);
      if (data.success) {
        const token = localStorage.getItem("ysho_token") || "";
        login(token, data.user);
        setEditingProfile(false);
      }
    } finally { setProfileSaving(false); }
  };

  // ── Address handlers ──
  const handleSaveAddress = async (values: AddressForm) => {
    const res = editingAddr
      ? await userApi.updateAddress(editingAddr._id, values)
      : await userApi.addAddress(values as Omit<SavedAddress, "_id">);
    if (res.success) setAddresses(res.addresses);
  };

  const handleDeleteAddress = async (id: string) => {
    const res = await userApi.deleteAddress(id);
    if (res.success) setAddresses(res.addresses);
  };

  const handleSetDefault = async (id: string) => {
    const res = await userApi.setDefaultAddress(id);
    if (res.success) setAddresses(res.addresses);
  };

  const labelIcon = (label: string) => {
    if (label === "home")  return <Home className="w-3.5 h-3.5" />;
    if (label === "work")  return <Briefcase className="w-3.5 h-3.5" />;
    return <MoreHorizontal className="w-3.5 h-3.5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-golden/10 flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <img src={yshoLogo} alt="Ysho Logo" className="h-10 w-auto rounded-full" />
          <span className="text-xl font-bold text-warm-brown">Ysho Essence of Nature</span>
        </Link>
      </header>

      <div className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
        {/* Page title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-full bg-golden/10 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-golden" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="profile"  className="flex items-center gap-1.5"><User className="w-4 h-4" />Profile</TabsTrigger>
            <TabsTrigger value="addresses" className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />Addresses</TabsTrigger>
            <TabsTrigger value="orders"   className="flex items-center gap-1.5"><ShoppingBag className="w-4 h-4" />Orders</TabsTrigger>
          </TabsList>

          {/* ── Profile tab ── */}
          <TabsContent value="profile">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle>Personal Information</CardTitle>
                {!editingProfile && (
                  <Button variant="outline" size="sm" onClick={() => { profileForm.reset({ name: user?.name || "", phone: user?.phone || "" }); setEditingProfile(true); }}>
                    <Edit2 className="w-4 h-4 mr-1.5" />Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editingProfile ? (
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4 max-w-sm">
                      <FormField control={profileForm.control} name="name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={profileForm.control} name="phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                          <FormControl><Input type="tel" placeholder="10-digit mobile" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="flex gap-2 pt-1">
                        <Button type="submit" variant="golden" size="sm" disabled={profileSaving}>
                          {profileSaving ? "Saving…" : "Save"}
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => setEditingProfile(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
                    {[
                      { label: "Full Name",  value: user?.name },
                      { label: "Email",      value: user?.email },
                      { label: "Phone",      value: user?.phone || "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <dt className="text-muted-foreground mb-1">{label}</dt>
                        <dd className="font-medium text-foreground">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Addresses tab ── */}
          <TabsContent value="addresses">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Saved Addresses</h2>
              <Button variant="golden" size="sm" onClick={() => { setEditingAddr(null); setDialogOpen(true); }}>
                <Plus className="w-4 h-4 mr-1.5" />Add Address
              </Button>
            </div>

            {addrLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-golden border-t-transparent rounded-full animate-spin" />
              </div>
            ) : addresses.length === 0 ? (
              <Card className="border-border/50 border-dashed">
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 text-golden/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No saved addresses yet.</p>
                  <Button variant="golden" size="sm" onClick={() => { setEditingAddr(null); setDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1.5" />Add Your First Address
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <Card key={addr._id} className={`border transition-colors ${addr.isDefault ? "border-golden/40 bg-golden/5" : "border-border/50"}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize flex items-center gap-1 text-xs">
                            {labelIcon(addr.label)}{addr.label}
                          </Badge>
                          {addr.isDefault && (
                            <Badge className="bg-golden/10 text-golden border-golden/20 text-xs">Default</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingAddr(addr); setDialogOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteAddress(addr._id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="font-semibold text-sm">{addr.fullName}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} — {addr.pincode}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{addr.phone}</p>
                      {!addr.isDefault && (
                        <button onClick={() => handleSetDefault(addr._id)} className="mt-3 text-xs text-golden hover:underline">
                          Set as default
                        </button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <AddressDialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              initial={editingAddr}
              onSave={handleSaveAddress}
            />
          </TabsContent>

          {/* ── Orders tab ── */}
          <TabsContent value="orders">
            <h2 className="text-lg font-semibold mb-4">Order History</h2>

            {ordersLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-golden border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <Card className="border-border/50 border-dashed">
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="w-12 h-12 text-golden/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No orders yet.</p>
                  <Button variant="golden" size="sm" asChild>
                    <Link to="/">Shop Now</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const expanded = expandedOrder === order._id;
                  return (
                    <Card key={order._id} className="border-border/50">
                      <CardContent className="p-5">
                        {/* Order header row */}
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Order #{order._id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "long", year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-golden">₹{order.amount.toLocaleString("en-IN")}</span>
                            <Badge variant="outline" className={`capitalize text-xs ${statusBadgeVariant(order.status)}`}>
                              {order.status}
                            </Badge>
                            <button
                              onClick={() => setExpandedOrder(expanded ? null : order._id)}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Items preview (always visible) */}
                        <div className="mt-3 text-sm text-muted-foreground">
                          {order.items.map((item) => (
                            <span key={item.productId}>
                              {item.name} × {item.quantity}
                            </span>
                          ))}
                        </div>

                        {/* Expanded detail */}
                        {expanded && (
                          <div className="mt-4">
                            <Separator className="mb-4" />

                            {/* Order status stepper */}
                            <p className="text-sm font-semibold mb-1">Order Status</p>
                            <OrderTracker status={order.status} />

                            {/* India Post live tracking */}
                            {["shipped", "delivered"].includes(order.status) && (
                              <>
                                <Separator className="my-4" />
                                <IndiaPostTracking orderId={order._id} />
                              </>
                            )}

                            <Separator className="my-4" />

                            {/* Items breakdown */}
                            <p className="text-sm font-semibold mb-3">Items</p>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.productId} className="flex justify-between text-sm">
                                  <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-muted-foreground text-xs">{item.variant} × {item.quantity}</p>
                                  </div>
                                  <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                                </div>
                              ))}
                            </div>

                            <Separator className="my-4" />

                            {/* Delivery address */}
                            <p className="text-sm font-semibold mb-2">Delivery Address</p>
                            <div className="text-sm text-muted-foreground leading-relaxed">
                              <p className="font-medium text-foreground">{order.address.fullName}</p>
                              <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
                              <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                              <p>{order.address.phone}</p>
                            </div>

                            {order.razorpayPaymentId && (
                              <>
                                <Separator className="my-4" />
                                <p className="text-xs text-muted-foreground">
                                  Payment ID: <span className="font-mono">{order.razorpayPaymentId}</span>
                                </p>
                              </>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/30 mt-auto">
        &copy; {new Date().getFullYear()} Ysho A2 Desi Cow Bilona Ghee. All rights reserved.
      </footer>
    </div>
  );
};

export default Profile;
