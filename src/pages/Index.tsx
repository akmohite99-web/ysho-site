import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Sparkles, 
  Shield, 
  Award, 
  Phone, 
  Mail, 
  MapPin,
  Star,
  Leaf,
  Droplets
} from "lucide-react";
import heroGhee from "@/assets/hero-ghee.jpg";
import a2Cow from "@/assets/a2-cow.jpg";
import bilonaProcess from "@/assets/bilona-process.jpg";
import yshoLogo from "@/assets/ysho-logo.jpeg";
import labelCenter from "@/assets/label-center.png";
import labelInfo from "@/assets/label-info.png";
import labelPait from "@/assets/label-pait.png";
import yshoPackaging from "@/assets/ysho-packaging-hero.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={yshoLogo} alt="Ysho Essence of Nature Logo" className="h-12 w-auto rounded-full" />
              <h1 className="text-2xl font-bold text-golden">Ysho Essence of Nature</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#home" className="text-foreground hover:text-golden transition-colors">Home</a>
              <a href="#benefits" className="text-foreground hover:text-golden transition-colors">Benefits</a>
              <a href="#process" className="text-foreground hover:text-golden transition-colors">Process</a>
              <a href="#contact" className="text-foreground hover:text-golden transition-colors">Contact</a>
            </div>
            <Button variant="golden" size="sm">Order Now</Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-cream via-background to-golden/10">
        <div className="container mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-16 items-center">
            <div className="animate-fade-in">
              <Badge variant="secondary" className="mb-6 bg-golden/10 text-golden border-golden/20">
                <Sparkles className="w-4 h-4 mr-2" />
                Premium A2 Bilona Ghee
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold mb-2 leading-tight">
                <span className="text-ysho-green">Ysho</span>{" "}
                <span className="text-golden">Amrut</span>
              </h1>
              <p className="text-xl lg:text-2xl font-medium text-muted-foreground mb-6">
                <span className="text-foreground">Pure </span>
                <span className="text-golden">Golden</span>
                <span className="text-foreground"> Tradition</span>
              </p>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Experience the finest A2 Desi Cow Bilona Ghee, crafted using time-honored traditional methods. 
                Made from A2 cow milk and natural yoghurt - 100% handmade with no chemicals.
              </p>
              <div className="mb-6">
                <p className="text-2xl font-bold text-golden">₹1,899/- <span className="text-sm text-muted-foreground font-normal">for 500ml (450g)</span></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button variant="hero" size="xl" className="animate-glow">
                  <Heart className="w-5 h-5 mr-2" />
                  Order Premium Ghee
                </Button>
                <Button variant="premium" size="xl">
                  Learn Our Process
                </Button>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-golden text-golden" />
                  ))}
                  <span className="ml-2 text-sm font-medium">5.0 Rating</span>
                </div>
                <div className="h-6 w-px bg-border" />
                <p className="text-sm text-muted-foreground">100% Natural & Pure</p>
              </div>
            </div>
            <div className="relative animate-float flex justify-center lg:justify-end min-h-[320px] lg:min-h-[420px]">
              <div className="absolute inset-0 bg-gradient-to-r from-golden/20 to-transparent rounded-2xl blur-3xl" />
              <div className="relative rounded-2xl shadow-2xl overflow-hidden bg-gradient-to-br from-cream via-background to-golden/10 w-full max-w-xl lg:max-w-2xl xl:max-w-3xl scale-[0.8] origin-center">
                <img 
                  src={yshoPackaging} 
                  alt="Ysho Amrut A2 Desi Cow Bilona Ghee - Product box and jar packaging"
                  className="relative rounded-2xl w-full h-auto object-contain mix-blend-darken"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-gradient-to-b from-background to-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <Badge variant="outline" className="mb-4 border-golden text-golden">
              <Award className="w-4 h-4 mr-2" />
              Health Benefits
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Why Choose A2 Bilona Ghee?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the incredible health benefits and superior taste of traditional A2 Bilona Ghee
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Heart className="w-8 h-8 text-golden" />,
                title: "Boosts Brain Function",
                description: "Enhances cognitive abilities and supports mental clarity"
              },
              {
                icon: <Heart className="w-8 h-8 text-golden" />,
                title: "Supports Heart Health",
                description: "Promotes cardiovascular wellness naturally"
              },
              {
                icon: <Sparkles className="w-8 h-8 text-golden" />,
                title: "Balances Hormones & Mind",
                description: "Helps maintain hormonal equilibrium and mental balance"
              },
              {
                icon: <Award className="w-8 h-8 text-golden" />,
                title: "Excellent for Children & Elderly",
                description: "Provides essential nutrition for all ages"
              },
              {
                icon: <Shield className="w-8 h-8 text-golden" />,
                title: "Strengthens Immunity",
                description: "Fortifies your body's natural defense system"
              },
              {
                icon: <Sparkles className="w-8 h-8 text-golden" />,
                title: "Improves Digestion",
                description: "Aids in better digestive health and metabolism"
              },
              {
                icon: <Leaf className="w-8 h-8 text-golden" />,
                title: "Enhances Skin Glow & Hair Strength",
                description: "Nourishes skin and strengthens hair from within"
              },
              {
                icon: <Sparkles className="w-8 h-8 text-golden" />,
                title: "Boosts Metabolism & Weight Loss",
                description: "Supports healthy weight management naturally"
              },
              {
                icon: <Shield className="w-8 h-8 text-golden" />,
                title: "Strengthens Bones & Joints",
                description: "Promotes strong bones and flexible joints"
              },
              {
                icon: <Droplets className="w-8 h-8 text-golden" />,
                title: "Detoxifies & Heals Tissues",
                description: "Natural detoxification and tissue healing properties"
              }
            ].map((benefit, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-border/50 hover:border-golden/30">
                <CardContent className="p-8 text-center">
                  <div className="mb-4 flex justify-center group-hover:animate-float">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-golden transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-golden text-golden">
              <Sparkles className="w-4 h-4 mr-2" />
              Traditional Process
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Our Sacred A2 Bilona Method</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We follow the ancient bilona churning process to create the purest, most nutritious ghee, 
              just as our ancestors did for centuries.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative mb-8 overflow-hidden rounded-2xl">
                <img 
                  src={a2Cow} 
                  alt="A2 dairy cows in green pasture"
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-brown/30 to-transparent" />
              </div>
              <div className="bg-golden w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-warm-brown font-bold text-xl">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-4">Pure A2 Milk</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Sourced from indigenous grass-fed desi cows that produce pure A2 protein milk, 
                naturally rich in nutrients and easier to digest.
              </p>
              <div className="bg-golden/10 border border-golden/20 rounded-lg p-4">
                <p className="text-sm font-semibold text-golden mb-2">Ingredients:</p>
                <p className="text-sm text-foreground">A2 Cow milk, Natural Yoghurt</p>
              </div>
            </div>

            <div className="text-center group">
              <div className="relative mb-8 overflow-hidden rounded-2xl">
                <img 
                  src={bilonaProcess} 
                  alt="Traditional bilona churning process"
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-brown/30 to-transparent" />
              </div>
              <div className="bg-golden w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-warm-brown font-bold text-xl">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-4">Traditional Churning</h3>
              <p className="text-muted-foreground leading-relaxed">
                Using the ancient bilona method, we hand-churn curd in traditional clay pots 
                to separate butter while preserving all natural nutrients.
              </p>
            </div>

            <div className="text-center group">
              <div className="relative mb-8 overflow-hidden rounded-2xl">
                <img 
                  src={heroGhee} 
                  alt="Golden ghee being prepared"
                  className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-brown/30 to-transparent" />
              </div>
              <div className="bg-golden w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-warm-brown font-bold text-xl">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-4">Pure Golden Ghee</h3>
              <p className="text-muted-foreground leading-relaxed">
                The butter is slowly heated to create pure, aromatic ghee with its distinctive 
                golden color and rich, nutty flavor that our customers love.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-golden-light via-golden to-golden-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience Pure Tradition?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of satisfied customers who have made the switch to our premium A2 Bilona Ghee. 
            Taste the difference of authentic, traditional ghee.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="secondary" size="xl" className="bg-white text-golden hover:bg-cream">
              <Phone className="w-5 h-5 mr-2" />
              Call: +91 90492 99369
            </Button>
            <Button variant="outline" size="xl" className="border-white text-white hover:bg-white hover:text-golden">
              <Mail className="w-5 h-5 mr-2" />
              Email Us
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Get In Touch</h2>
            <p className="text-xl text-muted-foreground">
              Have questions about our A2 Bilona Ghee? We're here to help!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8">
                <Phone className="w-12 h-12 text-golden mx-auto mb-4 group-hover:animate-float" />
                <h3 className="text-xl font-semibold mb-2">Call Us</h3>
                <p className="text-muted-foreground mb-4">Speak with our team</p>
                <p className="font-semibold text-golden">+91 90492 99369</p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8">
                <Mail className="w-12 h-12 text-golden mx-auto mb-4 group-hover:animate-float" />
                <h3 className="text-xl font-semibold mb-2">Email Us</h3>
                <p className="text-muted-foreground mb-4">Send us a message</p>
                <p className="font-semibold text-golden">care@ysho.in</p>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-8">
                <MapPin className="w-12 h-12 text-golden mx-auto mb-4 group-hover:animate-float" />
                <h3 className="text-xl font-semibold mb-2">Visit Us</h3>
                <p className="text-muted-foreground mb-4">Our dairy farm</p>
                <p className="font-semibold text-golden text-sm">Bahula Go Dham Organics<br/>Sasvand, At. Punjave, Post - Dhundalwadi<br/>Tal - Dahanu, Dist - Palghar-401606</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-warm-brown text-cream">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-golden mb-4">Ysho Amrut</h3>
            <p className="text-cream/80 mb-6 max-w-2xl mx-auto">
              Preserving traditional dairy wisdom while delivering the purest A2 Bilona Ghee 
              to your doorstep. Experience the taste of authentic heritage.
            </p>
            <div className="flex justify-center items-center gap-4 text-sm text-cream/60">
              <p>&copy; 2024 Ysho Amrut. All rights reserved.</p>
              <div className="h-4 w-px bg-cream/30" />
              <p>Made with ❤️ for pure tradition</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;