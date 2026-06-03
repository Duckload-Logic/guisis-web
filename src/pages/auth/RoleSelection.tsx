import { useAuth } from "@/context";
import { UserRole } from "@/features/users/types/user";
import { cn } from "@/lib/utils";
import { Shield, User, Code, Users, ArrowRight, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ROLE_ICONS: Record<string, React.ReactNode> = {
  student: <User className="h-8 w-8" />,
  admin: <Users className="h-8 w-8" />,
  superadmin: <Shield className="h-8 w-8" />,
  developer: <Code className="h-8 w-8" />,
};

const ROLE_COLORS: Record<string, string> = {
  student:
    "from-blue-500/20 to-indigo-500/20 " + "text-blue-500 border-blue-500/20",
  admin:
    "from-emerald-500/20 to-teal-500/20 " +
    "text-emerald-500 border-emerald-500/20",
  superadmin:
    "from-purple-500/20 to-pink-500/20 " +
    "text-purple-500 border-purple-500/20",
  developer:
    "from-amber-500/20 to-orange-500/20 " +
    "text-amber-500 border-amber-500/20",
};

const ROLE_ROUTES: Record<string, string> = {
  student: "/student",
  admin: "/admin",
  counselor: "/admin",
  superadmin: "/superadmin",
  developer: "/developer",
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
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12">
      {/* Background blobs for premium feel */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl tracking-tight text-foreground sm:text-5xl">
            Choose your <span className="text-primary">Identity</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome back, {user.firstName}. Select which workspace you'd like to
            enter.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {user.roles.map((role) => {
            const roleKey = role.name.toLowerCase().replace(/\s+/g, "");
            const icon = ROLE_ICONS[roleKey] || <Shield className="h-8 w-8" />;
            const colors = ROLE_COLORS[roleKey] || "from-muted/20 to-muted/10";

            return (
              <Card
                key={role.id}
                onClick={() => handleRoleSelect(role)}
                className={cn(
                  "group cursor-pointer overflow-hidden rounded-xl border-white/20 bg-white/40",
                  "backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50",
                  "hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-white/[0.02]",
                )}
              >
                <CardContent className="flex flex-col items-center p-8">
                  <div
                    className={cn(
                      "mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner",
                      colors,
                    )}
                  >
                    {icon}
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{role.name}</h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Access {role.name.toLowerCase()} tools and management.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Enter Workspace <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="pt-8">
          <Button
            variant="ghost"
            onClick={logout}
            className="rounded-full text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut className="mr-2 h-4 w-4" /> Not your account? Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
