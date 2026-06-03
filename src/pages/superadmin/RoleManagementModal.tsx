import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Checkbox from "@/components/form/Checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { UserAccount } from "@/features/system-admin/types";

interface RoleManagementModalProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (
    roleIds: number[],
    reason: string,
    referenceId: string,
  ) => Promise<void>;
  isUpdating: boolean;
}

const AVAILABLE_ROLES = [
  { id: 1, name: "Student" },
  { id: 2, name: "Counselor" },
  { id: 3, name: "Superadmin" },
  { id: 4, name: "Developer" },
];

export function RoleManagementModal({
  user,
  isOpen,
  onClose,
  onUpdate,
  isUpdating,
}: RoleManagementModalProps) {
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
  const [reason, setReason] = useState("");
  const [referenceId, setReferenceId] = useState("");

  useEffect(() => {
    if (user) {
      setSelectedRoles(user.roles.map((r) => r.id));
      setReason("");
      setReferenceId("");
    }
  }, [user]);

  const handleToggleRole = (roleId: number) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await onUpdate(selectedRoles, reason, referenceId);
    // onClose is handled by the caller or after success
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="dark:bg-neutral-900/92 border-white/20 bg-card backdrop-blur-2xl dark:border-white/10 sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
            <DialogDescription>
              Assign or remove roles for {user?.firstName} {user?.lastName}.
              Every change requires a justification for security auditing.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground/80">
                Available Roles
              </Label>
              <div className="grid grid-cols-2 gap-4">
                {AVAILABLE_ROLES.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      name={`role-${role.id}`}
                      label={role.name}
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => handleToggleRole(role.id)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="reason"
                className="text-sm font-semibold text-primary"
              >
                Justification / Reason *
              </Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Assigned as Student Assistant"
                className="rounded-xl border-white/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="ref"
                className="text-sm font-semibold text-muted-foreground"
              >
                Reference ID (Optional)
              </Label>
              <Input
                id="ref"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g., MEMO-2024-001"
                className="rounded-xl border-white/20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating || selectedRoles.length === 0 || !reason}
              className="rounded-xl bg-primary text-primary-foreground hover:brightness-110"
            >
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
