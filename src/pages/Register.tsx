import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, UserPlus, Mail, RotateCcw } from "lucide-react";
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

/* ── Step 1: Registration form schema ── */
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(60),
    email: z.string().email("Please enter a valid email"),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || /^[6-9]\d{9}$/.test(val), "Enter a valid 10-digit mobile number"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const [step, setStep]               = useState<"register" | "verify">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [apiError, setApiError]               = useState("");
  const [isSubmitting, setIsSubmitting]       = useState(false);
  const [otp, setOtp]                         = useState("");
  const [otpError, setOtpError]               = useState("");
  const [resendMsg, setResendMsg]             = useState("");
  const [resending, setResending]             = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // If redirected from login because email isn't verified, jump straight to verify step
  const locationState = location.state as { verifyEmail?: string } | null;
  if (locationState?.verifyEmail && step === "register") {
    setStep("verify");
    setRegisteredEmail(locationState.verifyEmail);
  }

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  /* ── Step 1: Submit registration ── */
  const onSubmit = async (values: RegisterForm) => {
    setApiError("");
    setIsSubmitting(true);
    try {
      const data = await authApi.register({
        name: values.name,
        email: values.email,
        password: values.password,
        ...(values.phone ? { phone: values.phone } : {}),
      });

      if (data.success) {
        setRegisteredEmail(values.email);
        setStep("verify");
      } else {
        if (Array.isArray(data.errors) && data.errors.length) {
          data.errors.forEach((err: { field: string; message: string }) => {
            if (err.field) form.setError(err.field as keyof RegisterForm, { message: err.message });
          });
        }
        setApiError(data.message || "Registration failed. Please try again.");
      }
    } catch {
      setApiError("Unable to connect to server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step 2: Verify OTP ── */
  const onVerify = async () => {
    if (otp.length !== 6) { setOtpError("Enter the 6-digit code."); return; }
    setOtpError("");
    setIsSubmitting(true);
    try {
      const data = await authApi.verifyEmail(registeredEmail, otp);
      if (data.success) {
        login(data.token, data.user);
        navigate("/", { replace: true });
      } else {
        setOtpError(data.message || "Invalid code. Please try again.");
      }
    } catch {
      setOtpError("Unable to connect to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Step 2: Resend code ── */
  const onResend = async () => {
    setResendMsg("");
    setResending(true);
    try {
      const data = await authApi.resendCode(registeredEmail);
      setResendMsg(data.success ? "New code sent! Check your inbox." : (data.message || "Failed to resend."));
    } catch {
      setResendMsg("Unable to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-golden/10 flex flex-col">
      <header className="py-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <img src={yshoLogo} alt="Ysho Logo" className="h-10 w-auto rounded-full" />
          <span className="text-xl font-bold text-warm-brown">Ysho Essence of Nature</span>
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md animate-fade-in shadow-xl border-border/50">

          {/* ── Step 1: Register form ── */}
          {step === "register" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-golden/10 flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-warm-brown" />
                </div>
                <CardTitle className="text-3xl font-bold text-warm-brown">Create Account</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Join the Ysho A2 Desi Cow Bilona Ghee family
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                {apiError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl><Input placeholder="Your full name" autoComplete="name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" placeholder="you@example.com" autoComplete="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                        <FormControl><Input type="tel" placeholder="10-digit mobile number" autoComplete="tel" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showPassword ? "text" : "password"} placeholder="Min. 8 characters" autoComplete="new-password" {...field} />
                            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showConfirm ? "text" : "password"} placeholder="Repeat your password" autoComplete="new-password" {...field} />
                            <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button type="submit" variant="golden" size="lg" className="w-full mt-2" disabled={isSubmitting}>
                      {isSubmitting
                        ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account…</span>
                        : "Create Account"}
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-warm-brown hover:underline">Sign in</Link>
                </p>
              </CardContent>
            </>
          )}

          {/* ── Step 2: Verify email OTP ── */}
          {step === "verify" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-golden/10 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-warm-brown" />
                </div>
                <CardTitle className="text-3xl font-bold text-warm-brown">Verify Email</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  We sent a 6-digit code to<br />
                  <span className="font-medium text-foreground">{registeredEmail}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {otpError && (
                  <Alert variant="destructive">
                    <AlertDescription>{otpError}</AlertDescription>
                  </Alert>
                )}
                {resendMsg && (
                  <Alert>
                    <AlertDescription>{resendMsg}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Verification Code</label>
                  <Input
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-2xl tracking-[0.5em] font-bold"
                    autoFocus
                  />
                </div>

                <Button variant="golden" size="lg" className="w-full" onClick={onVerify} disabled={isSubmitting || otp.length !== 6}>
                  {isSubmitting
                    ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</span>
                    : "Verify & Continue"}
                </Button>

                <div className="flex items-center justify-between text-sm text-muted-foreground pt-1">
                  <span>Didn't receive the code?</span>
                  <button onClick={onResend} disabled={resending} className="flex items-center gap-1 text-warm-brown hover:underline font-medium disabled:opacity-50">
                    <RotateCcw className="w-3 h-3" />
                    {resending ? "Sending…" : "Resend"}
                  </button>
                </div>
              </CardContent>
            </>
          )}

        </Card>
      </div>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/30">
        &copy; {new Date().getFullYear()} Ysho A2 Desi Cow Bilona Ghee. All rights reserved.
      </footer>
    </div>
  );
};

export default Register;
