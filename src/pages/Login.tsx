import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/lib/api";
import yshoLogo from "@/assets/ysho-logo.jpeg";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginForm) => {
    setApiError("");
    setIsSubmitting(true);
    try {
      const data = await authApi.login(values);
      if (data.success) {
        login(data.token, data.user);
        navigate(from, { replace: true });
      } else {
        setApiError(data.message || "Login failed. Please try again.");
      }
    } catch {
      setApiError("Unable to connect to server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-golden/10 flex flex-col">
      {/* Minimal header */}
      <header className="py-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <img src={yshoLogo} alt="Ysho Logo" className="h-10 w-auto rounded-full" />
          <span className="text-xl font-bold text-golden">Ysho Essence of Nature</span>
        </Link>
      </header>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md animate-fade-in shadow-xl border-border/50">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-golden/10 flex items-center justify-center">
              <LogIn className="w-8 h-8 text-golden" />
            </div>
            <CardTitle className="text-3xl font-bold text-golden">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              Sign in to your Ysho account
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {apiError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Min. 8 characters"
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((p) => !p)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            tabIndex={-1}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  variant="golden"
                  size="lg"
                  className="w-full mt-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Signing in…
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-medium text-golden hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/30">
        &copy; {new Date().getFullYear()} Ysho Amrut. All rights reserved.
      </footer>
    </div>
  );
};

export default Login;
