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
      <div className="flex min-h-[70vh] w-full flex-col items-center justify-center px-4 py-12">
        <div
          className={cn(
            "relative w-full max-w-[450px] overflow-hidden rounded-[30px]",
            "border border-neutral-200/70 bg-white/95 p-8 shadow-2xl",
            "shadow-neutral-900/10 dark:border-white/10",
            "dark:bg-neutral-950/95 dark:shadow-black/40",
            "transition-all dark:backdrop-blur-lg",
          )}
        >
          <AuthHeader
            title="Guidance Services Information System"
            subtitle={
              "Secure access to guidance services, " +
              "support, and account tools."
            }
          />
          <div className="mt-8">
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

        <div className="mt-6 text-center">
          <Link
            to="/"
            className={cn(
              "inline-flex items-center gap-2 text-sm text-slate-500",
              "hover:text-amber-500 dark:text-neutral-400",
              "dark:hover:text-amber-400 transition-colors",
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
