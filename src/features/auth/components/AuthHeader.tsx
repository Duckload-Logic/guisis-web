import { cn } from "@/lib/utils";
const LOGO_SRC = "/logo.svg";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="flex w-full flex-col text-left">
      {/* Removed the outer backgrounds, absolute gradients, and padding 
        so it blends perfectly into the parent grid panel in Login.tsx
      */}
      <div className="relative z-10 flex h-full flex-col justify-center">
        <div
          className={cn(
            "mb-6 inline-flex h-16 w-16 items-center justify-center",
            "rounded-2xl border border-[hsl(var(--border)/0.7)]",
            "bg-[hsl(var(--background)/0.75)]",
            "shadow-[0_12px_30px_-16px_rgba(15,23,42,0.22)] backdrop-blur",
          )}
        >
          <img
            src={LOGO_SRC}
            alt="Logo"
            className="h-10 w-10 object-contain"
          />
        </div>

        <div
          className={cn(
            "mb-4 w-fit rounded-full border",
            "border-[hsl(var(--primary)/0.25)]",
            "bg-[hsl(var(--background)/0.72)] px-3 py-1 text-[11px]",
            "font-semibold uppercase tracking-[0.2em] text-primary",
            "shadow-sm backdrop-blur",
          )}
        >
          User Portal
        </div>

        <h1 className="max-w-sm text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>

        <p className="mt-4 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300">
          {subtitle}
        </p>

        {/* Horizontal Divider */}
        <div className="mt-8 h-px w-24 bg-gradient-to-r from-[hsl(var(--primary)/0.5)] to-transparent" />
      </div>
    </div>
  );
}