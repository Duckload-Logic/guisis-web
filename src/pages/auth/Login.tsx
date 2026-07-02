import { useState } from "react";
import {
  AuthHeader,
  LoginForm,
  AuthMessages,
} from "@/features/auth/components";
import Layout from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { IDPLoginButton } from "@/features/auth/components/IDPLoginButton";
import { useNavigate, Link } from "react-router-dom";
import { useLogin } from "@/features/auth/hooks";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoggingIn: isNativeLoggingIn } = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const isLoading = isNativeLoggingIn;

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
              <span className="rounded-full border border-neutral-200 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:border-white/10">
                Sign In
              </span>
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Access your account
              </h2>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                Use your email, username, or institutional login to continue.
              </p>
            </div>

            <div className="w-full">
              {import.meta.env.VITE_IS_PRODUCTION === "true" ? (
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