import {
  Shield,
  User,
  Code,
  Users,
  ArrowRight,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context";
import type { UserRole } from "@/features/users/types/user";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROLE_ICONS: Record<string, LucideIcon> = {
  student: User,
  admin: Users,
  counselor: Users,
  superadmin: Shield,
  developer: Code,
  assistant: Users,
  studentassistant: Users,
};

const ROLE_THEMES: Record<string, { bg: string; text: string }> = {
  student: {
    bg: "from-blue-500/20 to-indigo-500/20 border-blue-500/20",
    text: "text-blue-500",
  },
  admin: {
    bg: "from-emerald-500/20 to-teal-500/20 border-emerald-500/20",
    text: "text-emerald-500",
  },
  superadmin: {
    bg: "from-purple-500/20 to-pink-500/20 border-purple-500/20",
    text: "text-purple-500",
  },
  developer: {
    bg: "from-amber-500/20 to-orange-500/20 border-amber-500/20",
    text: "text-amber-500",
  },
};

const DEFAULT_THEME = {
  bg: "from-muted/20 to-muted/10 border-border/40",
  text: "text-foreground",
};

const ROLE_ROUTES: Record<string, string> = {
  student: "/student",
  admin: "/admin",
  counselor: "/admin",
  superadmin: "/superadmin",
  developer: "/developer",
  assistant: "/assistant",
  studentassistant: "/assistant",
};

export default function RoleSelection() {
  const { user, setActiveRole, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleRoleSelect = (role: UserRole) => {
    const roleKey = role.name.toLowerCase().replace(/\s+/g, "");
    setActiveRole(role);
    navigate(ROLE_ROUTES[roleKey] || "/");
  };

  return (
    <div
      className={cn(
        "flex min-h-screen w-full flex-col items-center justify-center",
        "bg-background px-4 py-12",
      )}
    >
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Choose your <span className="text-primary">Workspace</span>
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Welcome back, {user.firstName}. Select your active role to proceed.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {user.roles.map((role) => {
            const roleKey = role.name.toLowerCase().replace(/\s+/g, "");
            const IconComponent = ROLE_ICONS[roleKey] || Shield;
            const theme = ROLE_THEMES[roleKey] || DEFAULT_THEME;

            return (
              <Card
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={cn(
                  "group cursor-pointer overflow-hidden rounded-xl border",
                  "border-border bg-card/60 transition-all duration-200",
                  "hover:-translate-y-0.5 hover:border-primary/50",
                  "hover:shadow-md active:scale-[0.99]",
                )}
              >
                <CardContent className="flex flex-col items-center p-6 sm:p-8">
                  <div
                    className={cn(
                      "mb-5 flex h-14 w-14 items-center justify-center",
                      "rounded-2xl border bg-gradient-to-br shadow-inner",
                      theme.bg,
                      theme.text,
                    )}
                  >
                    <IconComponent className="h-7 w-7" />
                  </div>

                  <h2 className="text-base font-bold tracking-tight">
                    {role.name.toUpperCase()}
                  </h2>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Access {role.name.toLowerCase()} workspace and tools.
                  </p>

                  <div
                    className={cn(
                      "mt-5 flex items-center gap-1.5 text-xs font-semibold",
                      "text-primary transition-transform duration-200",
                      "group-hover:translate-x-1",
                    )}
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="pt-4">
          <Button
            variant="ghost"
            onClick={logout}
            className={cn(
              "rounded-full text-xs text-muted-foreground",
              "hover:text-destructive",
            )}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Not your account? Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
