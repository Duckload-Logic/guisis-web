import { useState, useEffect } from "react";
import {
  AuthHeader,
  AuthMessages,
  RegisterForm,
} from "@/features/auth/components";
import Layout from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    if (import.meta.env.VITE_IS_PRODUCTION === "true") {
      navigate("/", { replace: true });
    }
  }, [navigate]);
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!firstName.trim()) {
      setError("Please enter your first name");
      setIsLoading(false);
      return;
    }

    if (!surname.trim()) {
      setError("Please enter your surname");
      setIsLoading(false);
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter a password");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    setIsLoading(false);
  };

  return (
    <Layout
      showHeader={false}
      isLoggedIn={false}
      isLoading={isLoading}
    >
      <section
        className={cn(
          "mx-auto flex w-full max-w-[1180px] items-center",
          "justify-center py-3 sm:py-5 lg:py-6",
        )}
      >
        <div
          className={cn(
            "relative grid w-full overflow-hidden rounded-[30px] border",
            "border-[hsl(var(--border)/0.65)] bg-[hsl(var(--card)/0.82)]",
            "shadow-[0_30px_90px_-40px_rgba(0,0,0,0.55)] backdrop-blur-2xl",
            "lg:grid-cols-[0.9fr_1.1fr]",
          )}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-red-500/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
            <div
              className={cn(
                "absolute inset-0",
                "bg-[linear-gradient(135deg,rgba(255,255,255,0.10),transparent_45%,rgba(255,255,255,0.03))]",
              )}
            />
          </div>

          <AuthHeader
            title="GuiSIS"
            subtitle="Create your account and get started with a cleaner, more focused onboarding flow."
          />

          <div className="relative flex items-center p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-xl">
              <div className="mb-7 space-y-2">
                <span
                  className={cn(
                    "inline-flex rounded-full border",
                    "border-[hsl(var(--border)/0.7)]",
                    "bg-[hsl(var(--background)/0.72)] px-3 py-1 text-[11px]",
                    "font-semibold uppercase tracking-[0.22em]",
                    "text-muted-foreground backdrop-blur",
                  )}
                >
                  Register
                </span>

                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Create your account
                </h2>

                <p className="text-sm leading-6 text-muted-foreground">
                  Fill in your details to access guidance services and student
                  support tools.
                </p>
              </div>

              <AuthMessages
                error={error}
                success={success}
              />

              <RegisterForm
                firstName={firstName}
                middleInitial={middleInitial}
                surname={surname}
                email={email}
                password={password}
                confirmPassword={confirmPassword}
                onFirstNameChange={setFirstName}
                onMiddleInitialChange={setMiddleInitial}
                onSurnameChange={setSurname}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Need help? Contact the guidance office.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
