import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, LogIn, KeyRound, RotateCcw } from "lucide-react";
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

/* ── Schemas ── */
const loginSchema = z.object({
  email:    z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const forgotEmailSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const resetSchema = z
  .object({
    code:            z.string().length(6, "Enter the 6-digit code"),
    newPassword:     z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type LoginForm       = z.infer<typeof loginSchema>;
type ForgotEmailForm = z.infer<typeof forgotEmailSchema>;
type ResetForm       = z.infer<typeof resetSchema>;

type Step = "login" | "forgot-email" | "forgot-reset";

const Login = () => {
  const [step, setStep]             = useState<Step>("login");
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [apiError, setApiError]         = useState("");
  const [successMsg, setSuccessMsg]     = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resending, setResending]       = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  /* ── Login form ── */
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onLogin = async (values: LoginForm) => {
    setApiError("");
    setIsSubmitting(true);
    try {
      const data = await authApi.login({ email: values.email, password: values.password });
      if (data.success) {
        login(data.token, data.user);
        navigate(from, { replace: true });
      } else if (data.needsVerification) {
        navigate("/register", { state: { verifyEmail: data.email } });
      } else {
        setApiError(data.message || "Login failed. Please try again.");
      }
    } catch {
      setApiError("Unable to connect to server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Forgot password: step 1 — enter email ── */
  const forgotEmailForm = useForm<ForgotEmailForm>({
    resolver: zodResolver(forgotEmailSchema),
    defaultValues: { email: "" },
  });

  const onForgotEmail = async (values: ForgotEmailForm) => {
    setApiError("");
    setIsSubmitting(true);
    try {
      const data = await authApi.forgotPassword(values.email);
      if (data.success) {
        setForgotEmail(values.email);
        setSuccessMsg("Reset code sent! Check your inbox.");
        setStep("forgot-reset");
      } else {
        setApiError(data.message || "Failed to send reset code.");
      }
    } catch {
      setApiError("Unable to connect to server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Forgot password: step 2 — enter code + new password ── */
  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  const onReset = async (values: ResetForm) => {
    setApiError("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      const data = await authApi.resetPassword(forgotEmail, values.code, values.newPassword);
      if (data.success) {
        setStep("login");
        setSuccessMsg("Password reset! You can now sign in with your new password.");
        resetForm.reset();
        forgotEmailForm.reset();
      } else {
        setApiError(data.message || "Failed to reset password.");
      }
    } catch {
      setApiError("Unable to connect to server. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Resend reset code ── */
  const onResend = async () => {
    setResending(true);
    setApiError("");
    setSuccessMsg("");
    try {
      const data = await authApi.forgotPassword(forgotEmail);
      setSuccessMsg(data.success ? "New code sent! Check your inbox." : (data.message || "Failed to resend."));
    } catch {
      setApiError("Unable to resend. Please try again.");
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

          {/* ── Step: Login ── */}
          {step === "login" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-golden/10 flex items-center justify-center">
                  <LogIn className="w-8 h-8 text-warm-brown" />
                </div>
                <CardTitle className="text-3xl font-bold text-warm-brown">Welcome Back</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Sign in to your Ysho account
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                {successMsg && (
                  <Alert className="mb-4">
                    <AlertDescription>{successMsg}</AlertDescription>
                  </Alert>
                )}
                {apiError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                )}

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <button
                            type="button"
                            onClick={() => { setApiError(""); setSuccessMsg(""); setStep("forgot-email"); }}
                            className="text-xs text-warm-brown hover:underline font-medium"
                          >
                            Forgot password?
                          </button>
                        </div>
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
                    )} />

                    <Button type="submit" variant="golden" size="lg" className="w-full mt-2" disabled={isSubmitting}>
                      {isSubmitting
                        ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in…</span>
                        : "Sign In"}
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Don&apos;t have an account?{" "}
                  <Link to="/register" className="font-medium text-warm-brown hover:underline">Create one</Link>
                </p>
              </CardContent>
            </>
          )}

          {/* ── Step: Forgot — enter email ── */}
          {step === "forgot-email" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-golden/10 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-warm-brown" />
                </div>
                <CardTitle className="text-3xl font-bold text-warm-brown">Reset Password</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Enter your email and we'll send a reset code
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                {apiError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                )}

                <Form {...forgotEmailForm}>
                  <form onSubmit={forgotEmailForm.handleSubmit(onForgotEmail)} className="space-y-4">
                    <FormField control={forgotEmailForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" autoComplete="email" autoFocus {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button type="submit" variant="golden" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting
                        ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</span>
                        : "Send Reset Code"}
                    </Button>
                  </form>
                </Form>

                <p className="text-center text-sm text-muted-foreground mt-6">
                  Remember your password?{" "}
                  <button onClick={() => { setApiError(""); setStep("login"); }} className="font-medium text-warm-brown hover:underline">
                    Back to sign in
                  </button>
                </p>
              </CardContent>
            </>
          )}

          {/* ── Step: Forgot — enter code + new password ── */}
          {step === "forgot-reset" && (
            <>
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-golden/10 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-warm-brown" />
                </div>
                <CardTitle className="text-3xl font-bold text-warm-brown">Set New Password</CardTitle>
                <CardDescription className="text-muted-foreground mt-1">
                  Enter the code sent to<br />
                  <span className="font-medium text-foreground">{forgotEmail}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                {successMsg && (
                  <Alert className="mb-4">
                    <AlertDescription>{successMsg}</AlertDescription>
                  </Alert>
                )}
                {apiError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                )}

                <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-4">
                    <FormField control={resetForm.control} name="code" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reset Code</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="6-digit code"
                            maxLength={6}
                            autoFocus
                            className="text-center text-2xl tracking-[0.5em] font-bold"
                            {...field}
                            onChange={e => field.onChange(e.target.value.replace(/\D/g, ""))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={resetForm.control} name="newPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input type={showNew ? "text" : "password"} placeholder="Min. 8 characters" autoComplete="new-password" {...field} />
                            <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={resetForm.control} name="confirmPassword" render={({ field }) => (
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

                    <Button type="submit" variant="golden" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting
                        ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting…</span>
                        : "Reset Password"}
                    </Button>
                  </form>
                </Form>

                <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
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

export default Login;
