import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2, Package, MapPin, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { orderApi } from "@/lib/api";
import yshoLogo from "@/assets/ysho-logo.jpeg";

interface Order {
  _id: string;
  items: { productId: string; name: string; variant: string; price: number; quantity: number }[];
  address: { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };
  amount: number;
  razorpayPaymentId: string;
  status: string;
  createdAt: string;
}

const OrderConfirmation = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    orderApi.getById(orderId).then((data) => {
      if (data.success) setOrder(data.order);
    }).finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-full border-4 border-golden border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-golden/10 flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <img src={yshoLogo} alt="Ysho Logo" className="h-10 w-auto rounded-full" />
          <span className="text-xl font-bold text-golden">Ysho Essence of Nature</span>
        </Link>
      </header>

      <div className="flex-1 container mx-auto px-4 py-12 max-w-2xl">
        {/* Success banner */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-ysho-green/10 mb-4">
            <CheckCircle2 className="w-12 h-12 text-ysho-green" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Order Placed!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. We'll process your order shortly.
          </p>
        </div>

        {order ? (
          <div className="space-y-4">
            {/* Payment info */}
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3 font-semibold text-foreground">
                  <Receipt className="w-5 h-5 text-golden" />
                  Payment Details
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-xs break-all">{order._id}</span>
                  <span className="text-muted-foreground">Payment ID</span>
                  <span className="font-mono text-xs break-all">{order.razorpayPaymentId}</span>
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize font-medium text-ysho-green">{order.status}</span>
                  <span className="text-muted-foreground">Date</span>
                  <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3 font-semibold text-foreground">
                  <Package className="w-5 h-5 text-golden" />
                  Items Ordered
                </div>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-muted-foreground">{item.variant} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-bold">
                  <span>Total Paid</span>
                  <span className="text-golden">₹{order.amount.toLocaleString("en-IN")}</span>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3 font-semibold text-foreground">
                  <MapPin className="w-5 h-5 text-golden" />
                  Delivery Address
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  <p className="font-medium text-foreground">{order.address.fullName}</p>
                  <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
                  <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                  <p className="mt-1">{order.address.phone}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-6 text-center text-muted-foreground">
              Order details could not be loaded.
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 mt-8 justify-center">
          <Button variant="golden" size="lg" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/30">
        &copy; {new Date().getFullYear()} Ysho A2 Desi Cow Bilona Ghee. All rights reserved.
      </footer>
    </div>
  );
};

export default OrderConfirmation;
