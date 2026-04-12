import { Link, useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import yshoLogo from "@/assets/ysho-logo.jpeg";

const Cart = () => {
  const { items, totalItems, totalAmount, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
    } else {
      navigate("/checkout");
    }
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
        <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8 text-golden" />
          Your Cart
          {totalItems > 0 && (
            <span className="text-lg font-normal text-muted-foreground">({totalItems} item{totalItems > 1 ? "s" : ""})</span>
          )}
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-24">
            <ShoppingBag className="w-20 h-20 text-golden/30 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-muted-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Add our premium ghee to get started.</p>
            <Button variant="golden" size="lg" asChild>
              <Link to="/">Shop Now</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.productId} className="border-border/50">
                  <CardContent className="p-5">
                    <div className="flex gap-4 items-start">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-contain rounded-xl bg-cream border border-border/30 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground leading-tight">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.variant}</p>
                        <p className="text-golden font-bold text-lg mt-1">₹{item.price.toLocaleString("en-IN")}</p>

                        <div className="flex items-center justify-between mt-3">
                          {/* Quantity controls */}
                          <div className="flex items-center gap-2 border border-border rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(item.productId, item.variant, item.quantity - 1)}
                              className="px-3 py-1.5 hover:bg-golden/10 transition-colors text-foreground"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="px-3 py-1.5 font-semibold min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.variant, item.quantity + 1)}
                              className="px-3 py-1.5 hover:bg-golden/10 transition-colors text-foreground"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.productId, item.variant)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="font-bold text-foreground text-right flex-shrink-0">
                        ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order summary */}
            <div>
              <Card className="border-border/50 sticky top-24">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-5">Order Summary</h2>

                  <div className="space-y-3 text-sm">
                    {items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-muted-foreground">
                        <span>{item.name} × {item.quantity}</span>
                        <span>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Subtotal</span>
                    <span>₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <span>Shipping</span>
                    <span className="text-ysho-green font-medium">FREE</span>
                  </div>

                  <Separator className="mb-4" />

                  <div className="flex justify-between font-bold text-lg mb-6">
                    <span>Total</span>
                    <span className="text-golden">₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>

                  <Button
                    variant="golden"
                    size="lg"
                    className="w-full"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <Button variant="ghost" size="sm" className="w-full mt-3" asChild>
                    <Link to="/">Continue Shopping</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/30">
        &copy; {new Date().getFullYear()} Ysho A2 Desi Cow Bilona Ghee. All rights reserved.
      </footer>
    </div>
  );
};

export default Cart;
