import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShoppingCart,
  Leaf,
  Droplets,
  Shield,
  Sparkles,
  Star,
  Heart,
  Award,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  CheckCircle2,
  FlaskConical,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { productApi, Product, ProductVariant } from "@/lib/api";
import SiteHeader from "@/components/SiteHeader";

const BENEFITS = [
  { icon: <Droplets className="w-6 h-6" />,    title: "Deeply Moisturizes & Hydrates",      desc: "Provides intense, long-lasting hydration that penetrates every layer of the skin." },
  { icon: <Sparkles className="w-6 h-6" />,    title: "Nourishes All Skin Layers",          desc: "Rich in essential fatty acids that feed and strengthen skin from deep within." },
  { icon: <Shield className="w-6 h-6" />,      title: "Reverses Sun Damage",                desc: "Kashmiri saffron and A2 ghee work together to repair UV-damaged skin cells." },
  { icon: <Star className="w-6 h-6" />,        title: "Natural Anti-Ageing & Skin Renewal", desc: "Stimulates collagen production and accelerates skin cell renewal naturally." },
  { icon: <Leaf className="w-6 h-6" />,        title: "Reduces Dark Spots & Pigmentation",  desc: "Sandalwood oil and saffron visibly fade dark spots and even skin tone." },
  { icon: <CheckCircle2 className="w-6 h-6" />, title: "Heals Burns & Scars",              desc: "Ancient formulation known to soothe minor burns and reduce scar appearance." },
  { icon: <FlaskConical className="w-6 h-6" />, title: "Softens Fine Lines & Wrinkles",    desc: "Rose water and ghee deeply hydrate to visibly plump and soften fine lines." },
  { icon: <Heart className="w-6 h-6" />,       title: "Soothes Dry, Irritated & Inflamed Skin", desc: "Anti-inflammatory properties of rose water and sandalwood calm sensitive skin." },
  { icon: <Award className="w-6 h-6" />,       title: "Suitable for All Skin Types",        desc: "Gentle enough for sensitive skin, effective for oily, dry, and combination skin alike." },
];

const HOW_TO_USE = [
  { step: "1", title: "Cleanse",  desc: "Wash your face or target area with a gentle cleanser and pat dry." },
  { step: "2", title: "Apply",    desc: "Take a pea-sized amount and gently massage onto skin in circular motions." },
  { step: "3", title: "Absorb",   desc: "Allow it to absorb fully — works best applied at night before sleep." },
  { step: "4", title: "Repeat",   desc: "Use daily for best results. Suitable for face, hands, lips, and body." },
];

const ShatDhautaGhrita = () => {
  useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct]               = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    productApi.list().then((res) => {
      if (res.success) {
        const sdg = res.products.find((p: Product) => p.name === "Shat Dhauta Ghrita" && p.isActive);
        if (sdg) {
          setProduct(sdg);
          const active = sdg.variants.filter((v: ProductVariant) => v.isActive);
          setSelectedVariant(active[0] ?? null);
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    addToCart({
      productId: product._id,
      name:      product.name,
      variant:   selectedVariant.size,
      price:     selectedVariant.price,
      quantity:  1,
      image:     product.image,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-3">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-warm-brown transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-cream via-background to-golden/10 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Image */}
            <div className="relative flex justify-center order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-r from-golden/20 to-transparent rounded-3xl blur-3xl" />
              {product?.image ? (
                <img
                  src={product.image}
                  alt="Shat Dhauta Ghrita"
                  className="relative rounded-3xl shadow-2xl w-full max-w-md object-cover"
                />
              ) : (
                <div className="relative rounded-3xl shadow-2xl w-full max-w-md aspect-square bg-gradient-to-br from-cream via-golden/10 to-warm-brown/10 flex flex-col items-center justify-center border border-golden/20">
                  <Droplets className="w-28 h-28 text-warm-brown/30 mb-4" />
                  <p className="text-warm-brown/40 font-semibold text-lg">Product Image</p>
                  <p className="text-warm-brown/30 text-sm">Coming Soon</p>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <Badge variant="secondary" className="mb-5 bg-warm-brown/10 text-warm-brown border-warm-brown/20">
                <Leaf className="w-4 h-4 mr-2" />
                Ayurvedic Skincare
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold text-warm-brown mb-2 leading-tight">
                Shat Dhauta<br />Ghrita
              </h1>
              <p className="text-xl text-muted-foreground font-medium mb-4">
                शत धौत घृत — 100-Times Washed Ghee Cream
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6 text-lg">
                Pure A2 desi cow ghee, washed exactly 100 times with cold water in a traditional copper vessel —
                transforming into a silky white cream that nourishes, brightens, and heals the skin deeply and naturally.
              </p>

              {/* Star rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5 fill-warm-brown text-warm-brown" />)}
                </div>
                <span className="text-sm font-medium">Pure Ayurvedic Formula</span>
                <div className="h-5 w-px bg-border" />
                <span className="text-sm text-muted-foreground">No chemicals, ever</span>
              </div>

              {/* Key features */}
              <div className="grid grid-cols-2 gap-3 mb-7">
                {[
                  "Skin brightening",
                  "Deep moisturisation",
                  "Heals dry skin",
                  "Anti-ageing",
                ].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4 text-warm-brown shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Variant picker */}
              {loading ? (
                <div className="space-y-2 mb-6">
                  <div className="flex gap-2">{[1,2].map(i => <div key={i} className="h-10 w-20 bg-muted/40 animate-pulse rounded-lg" />)}</div>
                  <div className="h-8 w-40 bg-muted/40 animate-pulse rounded" />
                </div>
              ) : product ? (
                <div className="mb-7">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {product.variants.filter(v => v.isActive).map(v => (
                      <button
                        key={v.size}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-colors
                          ${selectedVariant?.size === v.size
                            ? "border-warm-brown bg-warm-brown/10 text-warm-brown"
                            : "border-border text-muted-foreground hover:border-warm-brown/50"}`}
                      >
                        {v.size}
                      </button>
                    ))}
                  </div>
                  {selectedVariant && (
                    <p className="text-3xl font-bold text-warm-brown">
                      ₹{selectedVariant.price.toLocaleString("en-IN")}/-
                      <span className="text-sm font-normal text-muted-foreground ml-2">for {selectedVariant.size}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground mb-7">Product currently unavailable.</p>
              )}

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="golden" size="lg" disabled={!selectedVariant} onClick={handleAddToCart} className="gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg" disabled={!selectedVariant} onClick={handleBuyNow}>
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is Shat Dhauta Ghrita */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-warm-brown/10 text-warm-brown border-warm-brown/20">
              <FlaskConical className="w-4 h-4 mr-2" />
              The Ancient Process
            </Badge>
            <h2 className="text-4xl font-bold mb-4">What is Shat Dhauta Ghrita?</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              <strong>Shat</strong> (शत) means <em>hundred</em>. <strong>Dhauta</strong> (धौत) means <em>washed</em>. <strong>Ghrita</strong> (घृत) means <em>ghee</em>.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                num: "01",
                title: "Start with Pure Ghee",
                desc: "We begin with our own A2 desi cow Bilona ghee — the finest, most potent base for this formulation.",
              },
              {
                num: "02",
                title: "Wash 100 Times",
                desc: "The ghee is placed in a traditional copper vessel and washed with cold water exactly 100 times, each time the water being discarded. This removes all impurities and transforms the texture.",
              },
              {
                num: "03",
                title: "Silky White Cream",
                desc: "After 100 washes, the dense golden ghee becomes a light, silky white cream — fully bioavailable and deeply skin-compatible.",
              },
            ].map(({ num, title, desc }) => (
              <div key={num} className="relative">
                <div className="w-14 h-14 rounded-full bg-golden/20 flex items-center justify-center mx-auto mb-5">
                  <span className="text-xl font-bold text-warm-brown">{num}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gradient-to-b from-cream to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-warm-brown/10 text-warm-brown border-warm-brown/20">
              <Sparkles className="w-4 h-4 mr-2" />
              1 Cream · 9 Benefits
            </Badge>
            <h2 className="text-4xl font-bold mb-4">9 Benefits of Shata-Dhauta Ghrita</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              One ancient cream. Nine powerful reasons to make it part of your daily ritual.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {BENEFITS.map(({ icon, title, desc }) => (
              <Card key={title} className="border-border/40 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-golden/15 flex items-center justify-center text-warm-brown mb-4">
                    {icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 bg-warm-brown/10 text-warm-brown border-warm-brown/20">
              <Leaf className="w-4 h-4 mr-2" />
              Application Guide
            </Badge>
            <h2 className="text-4xl font-bold mb-4">How to Use</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {HOW_TO_USE.map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-warm-brown text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-golden/10 border border-golden/20 rounded-xl text-sm text-muted-foreground">
            <strong className="text-warm-brown">Suitable for:</strong> All skin types including sensitive skin.
            Ideal for face, under-eye area, lips, hands, elbows, knees, and cracked heels.
          </div>
        </div>
      </section>

      {/* Ingredients */}
      <section className="py-16 bg-cream">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4 bg-warm-brown/10 text-warm-brown border-warm-brown/20">
              <Leaf className="w-4 h-4 mr-2" />
              Ingredients
            </Badge>
            <h2 className="text-3xl font-bold mb-3">What's Inside</h2>
            <p className="text-muted-foreground">
              100% natural, ancient method — prepared in a traditional copper vessel.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: <Droplets className="w-6 h-6" />, name: "Pure A2 Cow Ghee",    note: "Washed 100 times in cold water using a copper vessel" },
              { icon: <Sparkles className="w-6 h-6" />, name: "Kashmiri Saffron",    note: "Brightens skin tone and reverses sun damage" },
              { icon: <Leaf className="w-6 h-6" />,     name: "Sandalwood Oil",       note: "Fades pigmentation and soothes inflammation" },
              { icon: <Star className="w-6 h-6" />,     name: "Rose Water",           note: "Hydrates, softens, and calms sensitive skin" },
            ].map(({ icon, name, note }) => (
              <div key={name} className="flex items-start gap-4 bg-background border border-border/40 rounded-xl px-5 py-4 shadow-sm">
                <span className="text-warm-brown mt-0.5 shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-warm-brown">{name}</p>
                  <p className="text-sm text-muted-foreground">{note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6">No preservatives · No mineral oils · No synthetic fragrances · No parabens</p>
        </div>
      </section>

      {/* Buy Section */}
      <section className="py-20 bg-gradient-to-r from-golden-light via-golden to-golden-dark text-warm-brown">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Try?</h2>
          <p className="text-xl mb-4 opacity-90">
            {selectedVariant
              ? `₹${selectedVariant.price.toLocaleString("en-IN")} for ${selectedVariant.size}`
              : "Pure. Natural. Effective."}
          </p>
          <p className="mb-8 opacity-80 max-w-xl mx-auto">
            Free shipping on orders above ₹999. Packed carefully to preserve freshness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="xl" className="bg-white text-warm-brown hover:bg-cream gap-2" disabled={!selectedVariant} onClick={handleAddToCart}>
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </Button>
            <Button variant="secondary" size="xl" className="bg-white text-warm-brown hover:bg-cream" disabled={!selectedVariant} onClick={handleBuyNow}>
              Buy Now
            </Button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Have Questions?</h2>
            <p className="text-muted-foreground">We're happy to help with anything about Shat Dhauta Ghrita.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: <Phone className="w-8 h-8" />, label: "Call Us",   value: "+91 90492 99369" },
              { icon: <Mail className="w-8 h-8" />,  label: "Email Us",  value: "care@ysho.in" },
              { icon: <MapPin className="w-8 h-8" />, label: "Farm",     value: "Dahanu, Palghar, Maharashtra" },
            ].map(({ icon, label, value }) => (
              <Card key={label} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="text-warm-brown mx-auto mb-3 flex justify-center">{icon}</div>
                  <h3 className="font-semibold mb-1">{label}</h3>
                  <p className="text-sm text-warm-brown font-medium">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-warm-brown text-cream">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-bold text-golden mb-3">Ysho Essence of Nature</h3>
          <p className="text-cream/70 text-sm mb-4 max-w-xl mx-auto">
            Rooted in Ayurvedic tradition, crafted with love — from our A2 desi cow farm to your home.
          </p>
          <p className="text-cream/50 text-xs">&copy; {new Date().getFullYear()} Ysho A2 Desi Cow Bilona Ghee. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ShatDhautaGhrita;
