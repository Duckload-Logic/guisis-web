import { useState } from "react";
import {
  AuthHeader,
  LoginForm,
  AuthMessages,
} from "@/features/auth/components";
import Layout from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { IDPLoginButton } from "@/features/auth/components/IDPLoginButton";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useLogin } from "@/features/auth/hooks";
import { ArrowLeft } from "lucide-react";
import { PostOTPRequest, PostOTPLogin } from "@/features/auth/services";
import { FormField } from "@/components/shared";
import { Button } from "@/components/ui/button";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoggingIn: isNativeLoggingIn } = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const isFallback = searchParams.get("fallback") === "true";
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [email, setEmail] = useState("");
  const [isOTPLoading, setIsOTPLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isLoading = isNativeLoggingIn || isOTPLoading;

  const handleNativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login({ email: username, password });
      navigate("/auth/callback?type=native");
    } catch (err: any) {
      setError(err?.message || "Invalid email or password");
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    if (!email) {
      setError("Email is required");
      return;
    }
    setIsOTPLoading(true);
    try {
      await PostOTPRequest({ email });
      setOtpSent(true);
      setSuccessMessage("Verification code has been sent to your email.");
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to send verification code",
      );
    } finally {
      setIsOTPLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    if (!otpCode) {
      setError("Verification code is required");
      return;
    }
    setIsOTPLoading(true);
    try {
      await PostOTPLogin({ email, otp: otpCode });
      navigate("/auth/callback?type=native");
    } catch (err: any) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Invalid or expired verification code",
      );
    } finally {
      setIsOTPLoading(false);
    }
  };

  return (
    <Layout
      isLoggedIn={false}
      isLoading={isLoading}
      showHeader={true}
    >
      <div className="flex min-h-[75vh] w-full flex-col items-center justify-center px-4 py-12">
        <div
          className={cn(
            "relative w-full max-w-[1150px] overflow-hidden rounded-[32px]", 
            "border border-neutral-200/70 bg-white shadow-2xl",
            "shadow-neutral-900/10 dark:border-white/10",
            "dark:bg-neutral-950/95 dark:shadow-black/40",
            "transition-all dark:backdrop-blur-lg",
            "grid min-h-[650px] grid-cols-1 md:grid-cols-[4.5fr_5.5fr]" 
          )}
        >
          <div
            className={cn(
              "relative flex flex-col justify-center overflow-hidden p-10 sm:p-14 lg:p-16",
              "bg-white dark:bg-neutral-950", 
              "border-b border-neutral-200/50 md:border-b-0 md:border-r dark:border-white/10"
            )}
          >
            <div className="pointer-events-none absolute -left-16 -top-16 h-96 w-96 rounded-full bg-red-400/15 blur-[80px] dark:bg-red-900/20" />
            <div className="pointer-events-none absolute -left-8 -top-8 h-64 w-64 rounded-full bg-[#8f1113]/10 blur-[60px] dark:bg-[#8f1113]/20" />

            <div className="relative z-10">
              <AuthHeader
                title="Guidance Services Information System"
                subtitle={
                  "Secure access to guidance services, " +
                  "student support, and account tools."
                }
              />
            </div>
          </div>

          <div className="flex flex-col justify-center bg-white p-10 sm:p-14 lg:p-16 dark:bg-neutral-950/40">
            
            <div className="mb-8 text-left">
              <span
                className={cn(
                  "rounded-full border border-neutral-200 px-3 py-1",
                  "text-[10px] font-bold uppercase tracking-widest",
                  "text-neutral-500 dark:border-white/10",
                )}
              >
                Sign In
              </span>
              <h2
                className={cn(
                  "mt-5 text-2xl font-bold tracking-tight",
                  "text-neutral-900 dark:text-white",
                )}
              >
                {isFallback ? "Fallback Verification" : "Access your account"}
              </h2>
              <p
                className={cn(
                  "mt-2 text-sm text-neutral-500 dark:text-neutral-400",
                )}
              >
                {isFallback
                  ? "Identity Provider is down. Enter email to receive OTP."
                  : "Use your credentials or institutional login to continue."}
              </p>
            </div>

            <div className="w-full">
              {isFallback ? (
                <>
                  <AuthMessages
                    error={error}
                    success={successMessage}
                  />
                  {!otpSent ? (
                    <form onSubmit={handleRequestOTP} className="space-y-5">
                      <FormField
                        id="email"
                        label="Email Address"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your registered email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className={cn(
                          "h-12 rounded-2xl px-4 text-foreground " +
                            "backdrop-blur",
                          "border-[hsl(var(--border)/0.9)] " +
                            "bg-[hsl(var(--background)/0.78)]",
                          "shadow-[inset_0_1px_0_" +
                            "rgba(255,255,255,0.08)]",
                          "placeholder:text-muted-foreground " +
                            "focus-visible:ring-2",
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                          "h-12 w-full rounded-2xl bg-[#8f1113] " +
                            "text-sm font-semibold text-white " +
                            "shadow-lg transition hover:bg-[#6a0d0d] " +
                            "dark:hover:bg-[#6a0d0d] sm:text-base",
                        )}
                      >
                        {isLoading ? (
                          <div
                            className={cn(
                              "h-4 w-4 animate-spin rounded-full border-2",
                              "border-t-0 border-primary-foreground",
                            )}
                          />
                        ) : (
                          "Request Verification Code"
                        )}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-5">
                      <FormField
                        id="email-disabled"
                        label="Email Address"
                        type="email"
                        value={email}
                        disabled={true}
                        className={cn(
                          "h-12 rounded-2xl px-4 " +
                            "text-muted-foreground backdrop-blur",
                          "border-[hsl(var(--border)/0.9)] " +
                            "bg-[hsl(var(--background)/0.5)]",
                          "shadow-[inset_0_1px_0_" +
                            "rgba(255,255,255,0.08)]",
                        )}
                      />
                      <FormField
                        id="otp"
                        label="Verification Code (OTP)"
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        disabled={isLoading}
                        className={cn(
                          "h-12 rounded-2xl px-4 text-foreground " +
                            "backdrop-blur",
                          "border-[hsl(var(--border)/0.9)] " +
                            "bg-[hsl(var(--background)/0.78)]",
                          "shadow-[inset_0_1px_0_" +
                            "rgba(255,255,255,0.08)]",
                          "placeholder:text-muted-foreground " +
                            "focus-visible:ring-2",
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className={cn(
                          "h-12 w-full rounded-2xl bg-[#8f1113] " +
                            "text-sm font-semibold text-white " +
                            "shadow-lg transition hover:bg-[#6a0d0d] " +
                            "dark:hover:bg-[#6a0d0d] sm:text-base",
                        )}
                      >
                        {isLoading ? (
                          <div
                            className={cn(
                              "h-4 w-4 animate-spin rounded-full border-2",
                              "border-t-0 border-primary-foreground",
                            )}
                          />
                        ) : (
                          "Verify and Login"
                        )}
                      </Button>
                      <div className="text-center">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode("");
                            setError("");
                            setSuccessMessage("");
                          }}
                          className={cn(
                            "text-xs font-semibold text-[#8f1113] " +
                              "hover:underline",
                          )}
                        >
                          Change Email / Resend Code
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : import.meta.env.VITE_IS_PRODUCTION === "true" ? (
                <div className="text-center text-sm text-neutral-500 dark:text-neutral-400">
                  <p className="mb-6">
                    Login with your university IDP to continue.
                  </p>
                  <IDPLoginButton
                    disabled={isLoading}
                    className={cn(
                      "h-12 w-full rounded-2xl",
                      "bg-yellow-400 text-slate-900",
                      "font-semibold transition-all duration-200",
                      "hover:bg-yellow-500 dark:hover:bg-yellow-500",
                      "active:scale-[0.98] sm:text-base",
                      "shadow-[0_4px_12px_rgba(250,204,21,0.3)]",
                    )}
                  />
                </div>
              ) : (
                <>
                  <AuthMessages
                    error={error}
                    success=""
                  />
                  <LoginForm
                    username={username}
                    password={password}
                    onUsernameChange={setUsername}
                    onPasswordChange={setPassword}
                    onSubmit={handleNativeSubmit}
                    isLoading={isLoading}
                    onIDPError={setError}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className={cn(
              "inline-flex items-center gap-2 text-sm text-slate-500",
              "hover:text-[#8f1113] dark:text-neutral-400",
              "dark:hover:text-red-400 transition-colors",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}