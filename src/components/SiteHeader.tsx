import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import yshoLogo from "@/assets/ysho-logo.jpeg";

const NAV_LINKS = [
  { label: "Home",              href: "/",                   type: "link" },
  { label: "A2 Bilona Ghee",   href: "/",                   type: "link" },
  { label: "Shat Dhauta Ghrita", href: "/shat-dhauta-ghrita", type: "link" },
  { label: "Contact",           href: "/#contact",           type: "link" },
];

const SiteHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/shat-dhauta-ghrita") return location.pathname === "/shat-dhauta-ghrita";
    return location.pathname === "/" || location.pathname === "";
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={yshoLogo} alt="Ysho Essence of Nature Logo" className="h-12 w-auto rounded-full" />
            <span className="text-2xl font-bold text-warm-brown hidden sm:block">Ysho Essence of Nature</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center space-x-6">
            {NAV_LINKS.map(({ label, href }) => {
              const active =
                label === "Shat Dhauta Ghrita"
                  ? location.pathname === "/shat-dhauta-ghrita"
                  : label === "A2 Bilona Ghee"
                  ? location.pathname === "/"
                  : false;
              return (
                <Link
                  key={label}
                  to={href}
                  className={`font-medium transition-colors ${
                    active
                      ? "text-warm-brown font-semibold"
                      : "text-foreground hover:text-warm-brown"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="relative" asChild>
              <Link to="/cart">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-golden text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            </Button>

            {isAuthenticated ? (
              <>
                <Link to="/profile" className="hidden sm:inline text-sm font-medium text-warm-brown hover:underline underline-offset-2">
                  Hello, {user?.name.split(" ")[0]}
                </Link>
                <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-1">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
                <Button variant="golden" size="sm" onClick={() => navigate("/cart")}>
                  Order Now
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button variant="golden" size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default SiteHeader;
