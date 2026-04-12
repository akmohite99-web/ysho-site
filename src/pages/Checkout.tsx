import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { ShoppingBag, MapPin, Smartphone, Copy, CheckCircle2, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { orderApi, userApi, couponApi, SavedAddress } from "@/lib/api";
import yshoLogo from "@/assets/ysho-logo.jpeg";

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  line1: z.string().min(5, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

type AddressForm = z.infer<typeof addressSchema>;

interface UpiPaymentState {
  orderId: string;
  amount: number;
  upiId: string;
  upiName: string;
  upiLink: string;
}

const Checkout = () => {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [apiError, setApiError]           = useState("");
  const [isProcessing, setIsProcessing]   = useState(false);
  const [upiState, setUpiState]           = useState<UpiPaymentState | null>(null);
  const [utr, setUtr]                     = useState("");
  const [utrError, setUtrError]           = useState("");
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [copied, setCopied]               = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [couponInput, setCouponInput]       = useState("");
  const [couponLoading, setCouponLoading]   = useState(false);
  const [couponError, setCouponError]       = useState("");
  const [appliedCoupon, setAppliedCoupon]   = useState<{ code: string; discountPercent: number } | null>(null);

  useEffect(() => {
    if (items.length === 0) navigate("/cart");
  }, [items, navigate]);

  const form = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      fullName: user?.name || "",
      phone: user?.phone || "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  // Fetch saved addresses and pre-fill with default
  useEffect(() => {
    userApi.getAddresses().then((res) => {
      if (res.success && Array.isArray(res.addresses) && res.addresses.length > 0) {
        setSavedAddresses(res.addresses);
        const def: SavedAddress = res.addresses.find((a: SavedAddress) => a.isDefault) ?? res.addresses[0];
        setSelectedAddressId(def._id);
        form.reset({
          fullName: def.fullName,
          phone:    def.phone,
          line1:    def.line1,
          line2:    def.line2 ?? "",
          city:     def.city,
          state:    def.state,
          pincode:  def.pincode,
        });
      }
    }).catch(() => {/* silent — user can fill manually */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr._id);
    form.reset({
      fullName: addr.fullName,
      phone:    addr.phone,
      line1:    addr.line1,
      line2:    addr.line2 ?? "",
      city:     addr.city,
      state:    addr.state,
      pincode:  addr.pincode,
    });
  };

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError("");
    setCouponLoading(true);
    try {
      const res = await couponApi.validate(code);
      if (res.success) {
        setAppliedCoupon({ code: res.code, discountPercent: res.discountPercent });
        setCouponInput("");
      } else {
        setCouponError(res.message || "Invalid coupon.");
      }
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const discountAmount  = appliedCoupon ? Math.round(totalAmount * appliedCoupon.discountPercent / 100) : 0;
  const finalAmount     = totalAmount - discountAmount;

  // Step 1 — address submitted → create order, show UPI screen
  const onSubmit = async (address: AddressForm) => {
    setApiError("");
    setIsProcessing(true);
    try {
      const data = await orderApi.create({ items, address, couponCode: appliedCoupon?.code ?? null });
      if (!data.success) {
        setApiError(data.message || "Failed to create order.");
        setIsProcessing(false);
        return;
      }

      const upiLink =
        `upi://pay?pa=${encodeURIComponent(data.upiId)}` +
        `&pn=${encodeURIComponent(data.upiName)}` +
        `&am=${data.amount}` +
        `&cu=INR` +
        `&tn=${encodeURIComponent("Order " + data.orderId)}`;

      setUpiState({
        orderId: data.orderId,
        amount:  data.amount,
        upiId:   data.upiId,
        upiName: data.upiName,
        upiLink,
      });
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 — UTR submitted → confirm order
  const onSubmitUtr = async () => {
    if (!upiState) return;
    setUtrError("");

    if (!utr.trim()) {
      setUtrError("Please enter your UPI transaction / UTR number.");
      return;
    }

    setSubmittingUtr(true);
    try {
      const data = await orderApi.submitUtr(upiState.orderId, utr.trim());
      if (!data.success) {
        setUtrError(data.message || "Failed to submit UTR.");
        return;
      }
      clearCart();
      navigate(`/order-confirmation/${upiState.orderId}`);
    } catch {
      setUtrError("Something went wrong. Please try again.");
    } finally {
      setSubmittingUtr(false);
    }
  };

  const copyUpiId = () => {
    if (!upiState) return;
    navigator.clipboard.writeText(upiState.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      <div className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Smartphone className="w-8 h-8 text-golden" />
          Checkout
        </h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left panel */}
          <div className="lg:col-span-3">

            {/* ── Step 1: Address form ── */}
            {!upiState && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MapPin className="w-5 h-5 text-golden" />
                    Delivery Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {apiError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>{apiError}</AlertDescription>
                    </Alert>
                  )}

                  {savedAddresses.length > 0 && (
                    <div className="mb-5">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Saved Addresses</p>
                      <div className="space-y-2">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr._id}
                            type="button"
                            onClick={() => applyAddress(addr)}
                            className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors flex items-start gap-3 ${
                              selectedAddressId === addr._id
                                ? "border-golden bg-golden/5"
                                : "border-border/50 hover:border-golden/50"
                            }`}
                          >
                            <CheckCircle2
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                selectedAddressId === addr._id ? "text-golden" : "text-muted-foreground/30"
                              }`}
                            />
                            <div>
                              <span className="font-medium capitalize">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="ml-2 text-xs text-golden">(Default)</span>
                              )}
                              <p className="text-muted-foreground mt-0.5">
                                {addr.fullName} · {addr.phone}
                              </p>
                              <p className="text-muted-foreground">
                                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}, {addr.city}, {addr.state} – {addr.pincode}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <Separator className="my-4" />
                    </div>
                  )}

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Recipient's full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mobile Number</FormLabel>
                              <FormControl>
                                <Input type="tel" placeholder="10-digit mobile" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="line1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address Line 1</FormLabel>
                            <FormControl>
                              <Input placeholder="House/Flat no., Street, Area" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="line2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Address Line 2{" "}
                              <span className="text-muted-foreground font-normal">(optional)</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="Landmark, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid sm:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl><Input placeholder="City" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl><Input placeholder="State" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pincode</FormLabel>
                              <FormControl>
                                <Input placeholder="6-digit" maxLength={6} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="golden"
                        size="lg"
                        className="w-full mt-2"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Creating order…
                          </span>
                        ) : (
                          <>
                            <Smartphone className="w-4 h-4 mr-2" />
                            Proceed to Pay ₹{finalAmount.toLocaleString("en-IN")}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* ── Step 2: UPI payment ── */}
            {upiState && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Smartphone className="w-5 h-5 text-golden" />
                    Pay via UPI
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">

                  {/* Amount banner */}
                  <div className="bg-golden/10 border border-golden/30 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Amount to pay</p>
                    <p className="text-4xl font-bold text-golden">
                      ₹{upiState.amount.toLocaleString("en-IN")}
                    </p>
                  </div>

                  {/* QR code */}
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Scan with any UPI app</p>
                    <div className="p-4 bg-white rounded-xl border border-border/40 shadow-sm">
                      <QRCodeSVG
                        value={upiState.upiLink}
                        size={200}
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      GPay · PhonePe · Paytm · BHIM · Any UPI app
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">or pay manually</span>
                    <Separator className="flex-1" />
                  </div>

                  {/* UPI ID + deep link */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 bg-muted/40 border border-border/40 rounded-lg px-4 py-3">
                      <div>
                        <p className="text-xs text-muted-foreground">UPI ID</p>
                        <p className="font-semibold text-sm">{upiState.upiId}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={copyUpiId} className="gap-1.5 shrink-0">
                        {copied ? (
                          <><CheckCircle2 className="w-4 h-4 text-green-500" /> Copied</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copy</>
                        )}
                      </Button>
                    </div>

                    <a href={upiState.upiLink} className="block">
                      <Button variant="outline" className="w-full gap-2">
                        <Smartphone className="w-4 h-4" />
                        Open UPI App
                      </Button>
                    </a>
                  </div>

                  <Separator />

                  {/* UTR entry */}
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm">After payment, enter your UTR number</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Find it in your UPI app under transaction details (12-digit number)
                      </p>
                    </div>
                    <Input
                      placeholder="e.g. 123456789012"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      maxLength={22}
                    />
                    {utrError && (
                      <p className="text-sm text-destructive">{utrError}</p>
                    )}
                    <Button
                      variant="golden"
                      size="lg"
                      className="w-full"
                      onClick={onSubmitUtr}
                      disabled={submittingUtr}
                    >
                      {submittingUtr ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Confirming…
                        </span>
                      ) : (
                        "Confirm Payment"
                      )}
                    </Button>
                  </div>

                </CardContent>
              </Card>
            )}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <ShoppingBag className="w-5 h-5 text-golden" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3 items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 object-contain rounded-lg bg-cream border border-border/30 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-tight line-clamp-2">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.variant} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-sm flex-shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Coupon input */}
                {!upiState && (
                  <div className="mb-4">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                          <Tag className="w-4 h-4" />
                          <span className="font-semibold">{appliedCoupon.code}</span>
                          <span>— {appliedCoupon.discountPercent}% off</span>
                        </div>
                        <button onClick={removeCoupon} className="text-green-600 hover:text-green-800">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Coupon code"
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                          className="uppercase text-sm h-9"
                        />
                        <Button size="sm" variant="outline" onClick={applyCoupon} disabled={couponLoading || !couponInput.trim()} className="shrink-0 h-9">
                          {couponLoading ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                    )}
                    {couponError && <p className="text-xs text-destructive mt-1">{couponError}</p>}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount ({appliedCoupon.discountPercent}%)</span>
                      <span>− ₹{discountAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-ysho-green font-medium">FREE</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-golden">₹{finalAmount.toLocaleString("en-IN")}</span>
                </div>

                <div className="mt-4 p-3 bg-golden/5 border border-golden/20 rounded-lg text-xs text-muted-foreground text-center">
                  Pay directly via UPI · 100% free · No transaction fees
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/30">
        &copy; {new Date().getFullYear()} Ysho A2 Desi Cow Bilona Ghee. All rights reserved.
      </footer>
    </div>
  );
};

export default Checkout;
