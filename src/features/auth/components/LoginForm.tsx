import { Checkbox } from "@/components/form";
import { FormField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link } from "react-router-dom";
import { IDPLoginButton } from "./IDPLoginButton";

interface LoginFormProps {
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  onIDPError?: (error: string) => void;
}

export default function LoginForm({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  isLoading,
  onIDPError,
}: LoginFormProps) {
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="space-y-5"
      >
        <FormField
          id="username"
          label="Email or Username"
          type="text"
          autoComplete="username"
          placeholder="Enter your email or username"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          disabled={isLoading}
          className={cn(
            "h-12 rounded-2xl border-[hsl(var(--border)/0.9)] bg-[hsl(var(--background)/0.78)] px-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur placeholder:text-muted-foreground focus-visible:ring-2",
          )}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          disabled={isLoading}
          className={cn(
            "h-12 rounded-2xl border-[hsl(var(--border)/0.9)] bg-[hsl(var(--background)/0.78)] px-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur placeholder:text-muted-foreground focus-visible:ring-2",
          )}
        />

        <div
          className={cn(
            "flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <Checkbox
            label="Remember me"
            id="remember"
            name="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />

          <Link
            to="#"
            className={cn(
              "font-medium text-muted-foreground transition-colors hover:text-foreground",
            )}
          >
            Forgot password?
          </Link>
        </div>

        <div className="space-y-3 pt-1">
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_14px_30px_-16px_rgba(220,38,38,0.55)] transition hover:bg-primary/90 sm:text-base",
            )}
          >
            {isLoading ? (
              <div
                className={cn(
                  "h-4 w-4 animate-spin rounded-full border-2 border-t-0 border-primary-foreground",
                )}
              />
            ) : (
              "Login"
            )}
          </Button>

          <div className="relative">
            <div className={"absolute inset-0 flex items-center"}>
              <span
                className={cn(
                  "w-full border-t border-[hsl(var(--border)/0.5)]",
                )}
              />
            </div>
            <div className="relative flex justify-center text-xs">
              <span
                className={cn(
                  "bg-[hsl(var(--card)/0.82)] px-2 uppercase text-muted-foreground",
                )}
              >
                Or continue with
              </span>
            </div>
          </div>

          <IDPLoginButton
            onError={onIDPError}
            disabled={isLoading}
            className={cn(
              "h-12 w-full rounded-2xl border-[hsl(var(--border)/0.9)]",
              "bg-secondary",
              "!text-secondary-foreground",
              "backdrop-blur",
              "font-semibold transition-colors",
              "hover:brightness-110 dark:hover:brightness-90",
              "sm:text-base",
              "transition-all duration-200",
            )}
          />
        </div>
      </form>

      <p className={"mt-6 text-center text-sm text-muted-foreground"}>
        Don&apos;t have an account?{" "}
        <Link
          to="/register"
          className={cn(
            "font-semibold text-primary transition-colors hover:opacity-80",
          )}
        >
          Register here
        </Link>
      </p>
    </>
  );
}
