import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ShoppingBag, MapPin, CreditCard } from "lucide-react";
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
import { orderApi } from "@/lib/api";
import yshoLogo from "@/assets/ysho-logo.jpeg";

declare global {
  interface Window {
    Razorpay: new (options: object) => { open: () => void };
  }
}

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

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Checkout = () => {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

  const onSubmit = async (address: AddressForm) => {
    setApiError("");
    setIsProcessing(true);

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setApiError("Failed to load payment gateway. Please check your connection.");
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Create order on backend
      const data = await orderApi.create({ items, address });
      if (!data.success) {
        setApiError(data.message || "Failed to create order.");
        setIsProcessing(false);
        return;
      }

      const { orderId, razorpayOrderId, amount, currency, keyId } = data;

      // 2. Open Razorpay modal
      const rzp = new window.Razorpay({
        key:         keyId,
        amount,
        currency,
        name:        "Ysho A2 Desi Cow Bilona Ghee",
        description: "Premium A2 Bilona Ghee Order",
        order_id:    razorpayOrderId,
        prefill: {
          name:    user?.name,
          email:   user?.email,
          contact: address.phone,
        },
        theme:  { color: "#D4A017" },
        modal: {
          ondismiss: () => {
            setApiError("Payment was cancelled. You can try again.");
            setIsProcessing(false);
          },
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 3. Verify payment on backend
            const verify = await orderApi.verify({
              orderId,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verify.success) {
              clearCart();
              navigate(`/order-confirmation/${orderId}`);
            } else {
              setApiError("Payment verification failed. Please contact support.");
              setIsProcessing(false);
            }
          } catch {
            setApiError("Something went wrong verifying payment. Please contact support.");
            setIsProcessing(false);
          }
        },
      });

      rzp.open();
    } catch {
      setApiError("Something went wrong. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-golden/10 flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <img src={yshoLogo} alt="Ysho Logo" className="h-10 w-auto rounded-full" />
          <span className="text-xl font-bold text-golden">Ysho Essence of Nature</span>
        </Link>
      </header>

      <div className="flex-1 container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-golden" />
          Checkout
        </h1>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Address form */}
          <div className="lg:col-span-3">
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
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
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
                            <FormControl>
                              <Input placeholder="State" {...field} />
                            </FormControl>
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
                          Processing…
                        </span>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay ₹{totalAmount.toLocaleString("en-IN")}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
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

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-ysho-green font-medium">FREE</span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-golden">₹{totalAmount.toLocaleString("en-IN")}</span>
                </div>

                <div className="mt-4 p-3 bg-golden/5 border border-golden/20 rounded-lg text-xs text-muted-foreground text-center">
                  Secured by Razorpay · UPI, Cards, Net Banking & Wallets accepted
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
