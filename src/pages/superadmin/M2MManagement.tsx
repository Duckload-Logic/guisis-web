import { useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Ban,
  RefreshCw,
  Fingerprint,
} from "lucide-react";
import { usePageMetadata } from "@/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useM2MClients,
  useRevokeM2MClient,
  useRotateM2MSecret,
  useVerifyM2MClient,
  useRejectM2MClient,
} from "@/features/system-admin/hooks";
import type { M2MClient } from "@/features/system-admin/types";
import { Checkbox, FormInput } from "@/components/form";
import { formatDate } from "@/utils/dateTime";

export default function M2MManagement() {
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<M2MClient | null>(null);
  const [rotateTarget, setRotateTarget] = useState<M2MClient | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<M2MClient | null>(null);
  const [verifyPersonalInfo, setVerifyPersonalInfo] = useState(false);

  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const { data: clients = [], isLoading } = useM2MClients(includeRevoked);
  const revokeMutation = useRevokeM2MClient();
  const rotateMutation = useRotateM2MSecret();
  const verifyMutation = useVerifyM2MClient();
  const rejectMutation = useRejectM2MClient();

  const isPageLoading =
    isLoading ||
    revokeMutation.isPending ||
    rotateMutation.isPending ||
    verifyMutation.isPending ||
    rejectMutation.isPending;

  const activeClients = clients?.filter((c) => c.isActive) || [];
  const revokedClients = clients?.filter((c) => !c.isActive) || [];

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    await revokeMutation.mutateAsync(revokeTarget.id);
    setRevokeTarget(null);
  };

  const handleRotate = async () => {
    if (!rotateTarget) return;
    const result = await rotateMutation.mutateAsync(rotateTarget.id);
    setCreatedSecret(result.clientSecret);
    setRotateTarget(null);
    setIsCreateOpen(true); // Re-use the "secret reveal" modal logic
  };

  const handleVerify = async (id: number, hasPersonalInfoAccess: boolean) => {
    await verifyMutation.mutateAsync({ id, hasPersonalInfoAccess });
  };

  const handleReject = async (id: number) => {
    await rejectMutation.mutateAsync(id);
  };

  const handleCopySecret = async () => {
    if (!createdSecret) return;
    try {
      await navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy client secret:", error);
    }
  };

  const statCards = [
    {
      label: "Active Clients",
      value: activeClients.length,
      icon: ShieldCheck,
      iconClass:
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      label: "Revoked Clients",
      value: revokedClients.length,
      icon: Ban,
      iconClass:
        "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    {
      label: "Total Clients",
      value: clients?.length,
      icon: Fingerprint,
      iconClass: "bg-primary/10 text-primary border-primary/20",
    },
  ];

  usePageMetadata({
    title: "M2M Management",
    isLoading: isPageLoading,
    badgeText: "Infrastructure Access Control",
    badgeIcon: <Sparkles className="h-3.5 w-3.5" />,
    description:
      "Manage Machine-to-Machine clients for integration, " +
      "automation, and infrastructure services.",
  });

  return (
    <>
      <div className="mx-auto w-full max-w-[1700px] space-y-5">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.label}
                className="rounded-xl border-glass-border bg-glass-bg shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                        {card.value}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border backdrop-blur-md ${card.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Card className="overflow-hidden rounded-xl border-glass-border bg-glass-bg shadow-md">
          <CardHeader className="border-b border-white/20 pb-4 dark:border-white/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]">
                    <Fingerprint className="h-5 w-5 text-primary" />
                  </span>
                  M2M Clients
                </CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                  View and manage machine access to the platform.
                </p>
              </div>

              <Checkbox
                id={"show-revoked"}
                label="Show revoked clients"
                name={"show-revoked"}
                checked={includeRevoked}
                onCheckedChange={() => setIncludeRevoked((prev) => !prev)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {clients?.length === 0 ? (
              <div
                className={
                  "flex flex-col items-center justify-center " +
                  "px-6 py-14 text-center"
                }
              >
                <div
                  className={
                    "mb-4 flex h-14 w-14 items-center justify-center " +
                    "rounded-2xl border border-white/30 bg-white/60" +
                    "backdrop-blur-md dark:border-white/10" +
                    "dark:bg-white/[0.05]"
                  }
                >
                  <Fingerprint className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold text-foreground">
                  No M2M clients registered
                </p>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  No machine clients have been registered in the system yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-sm">
<thead>
                  <tr className="border-b border-white/20 bg-white/55 text-left backdrop-blur-md dark:border-white/10 dark:bg-white/[0.03]">
                    <th className="w-[25%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Client
                    </th>
                    <th className="w-[15%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Client ID
                    </th>
                    <th className="w-[20%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Status / Verification
                    </th>
                    <th className="w-[10%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Scopes
                    </th>
                    <th className="w-[10%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Last Activity
                    </th>
                    <th className="w-[10%] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Created
                    </th>
                    <th className="w-[10%] whitespace-nowrap px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>

                  <tbody>
                    {clients?.map((client) => (
                      <tr
                        key={client.id}
                        className="border-b border-white/10 transition-colors duration-150 hover:bg-white/35 dark:hover:bg-white/[0.03]"
                      >
                      <td className="px-5 py-4 align-middle">
                        <div className="flex min-w-0 flex-col space-y-0.5">
                          <div className="truncate font-medium text-foreground" title={client.clientName}>
                            {client.clientName}
                          </div>
                          <div className="truncate text-[11px] text-muted-foreground" title={client.clientDescription}>
                            {client.clientDescription}
                          </div>
                        </div>
                      </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <code className="rounded-lg border border-white/20 bg-white/55 px-2.5 py-1 font-mono text-[11px] text-foreground dark:border-white/10 dark:bg-white/[0.04]">
                              {client.isVerified ? (
                                client.clientId
                              ) : (
                                <span className="italic">••••••••••••</span>
                              )}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md"
                              onClick={() => {
                                navigator.clipboard.writeText(client.clientId);
                              }}
                              disabled={!client.isVerified}
                            >
                              <Copy size={12} />
                            </Button>
                          </div>
                        </td>

                        <td className="px-5 py-4 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={
                                client.isActive
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400"
                              }
                            >
                              {client.isActive ? "Active" : "Revoked"}
                            </Badge>
                            {client.isVerified && (
                              <Badge
                                variant="outline"
                                className="border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                              >
                                Verified
                              </Badge>
                            )}
                            {client.isVerified && (
                              <Badge
                                variant="outline"
                                className={
                                  client.hasPersonalInfoAccess
                                    ? "border-purple-500/20 " +
                                      "bg-purple-500/10 text-purple-700" +
                                      "dark:text-purple-400"
                                    : "border-slate-500/20 " +
                                      "bg-slate-500/10 text-slate-700" +
                                      "dark:text-slate-400"
                                }
                              >
                                {client.hasPersonalInfoAccess
                                  ? "PII: Allowed"
                                  : "PII: Denied"}
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {client.scopes && client.scopes.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {client.scopes.map((scope) => (
                                <Badge
                                  key={scope}
                                  variant="outline"
                                  className="rounded-full border-muted-foreground/20 px-2 py-0 text-[10px]"
                                >
                                  {scope}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs italic text-muted-foreground">
                              admin:full
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {client.lastUsedAt
                            ? formatDate(client.lastUsedAt)
                            : "Never"}
                        </td>

                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {formatDate(client.createdAt)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {client.isActive && (
                              <>
                                {!client.isVerified ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setVerifyTarget(client);
                                        setVerifyPersonalInfo(
                                          client.hasPersonalInfoAccess,
                                        );
                                      }}
                                      className={
                                        "h-8 w-8 rounded-xl p-0 " +
                                        "text-blue-600" +
                                        "hover:bg-blue-600/10" +
                                        "hover:text-blue-600"
                                      }
                                      title="Verify Client"
                                      disabled={verifyMutation.isPending}
                                    >
                                      <Check
                                        size={14}
                                        strokeWidth={3}
                                      />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleReject(client.id)}
                                      className={
                                        "h-8 w-8 rounded-xl p-0 " +
                                        "text-destructive" +
                                        "hover:bg-destructive/10" +
                                        "hover:text-destructive"
                                      }
                                      title="Reject Client"
                                      disabled={rejectMutation.isPending}
                                    >
                                      <Ban size={14} />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setVerifyTarget(client);
                                        setVerifyPersonalInfo(
                                          client.hasPersonalInfoAccess,
                                        );
                                      }}
                                      className={
                                        "h-8 w-8 rounded-xl p-0 " +
                                        "text-purple-600" +
                                        "hover:bg-purple-600/10"
                                      }
                                      title="Manage Personal Info Access"
                                    >
                                      <ShieldCheck size={14} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setRotateTarget(client)}
                                      className="h-8 w-8 rounded-xl p-0"
                                      title="Rotate Client Secret"
                                    >
                                      <RefreshCw
                                        size={14}
                                        className={"text-muted-foreground"}
                                      />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setRevokeTarget(client)}
                                      className={
                                        "h-8 w-8 rounded-xl p-0 " +
                                        "text-destructive" +
                                        "hover:bg-destructive/10" +
                                        "hover:text-destructive"
                                      }
                                      title="Revoke Client"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Secret Reveal Modal */}
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            if (!open) {
              setIsCreateOpen(false);
              setCreatedSecret(null);
              setShowSecret(false);
            }
          }}
        >
          <DialogContent className="backdrop-blur-2xl sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Client Secret Issued</DialogTitle>
              <DialogDescription>
                Store this secret securely — it will never be shown again.
              </DialogDescription>
            </DialogHeader>

            {createdSecret && (
              <div className="space-y-4">
                <div
                  className={
                    "rounded-xl border border-amber-500/20 " +
                    "bg-amber-500/10 p-4"
                  }
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      className={
                        "mt-0.5 h-5 w-5 flex-shrink-0 " +
                        "text-amber-600 dark:text-amber-400"
                      }
                    />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      Copy this secret now. You will not be able to retrieve it
                      later. If you lose it, you must rotate the secret.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] uppercase text-muted-foreground">
                    Client Secret
                  </Label>
                  <div
                    className={
                      "grid w-full grid-cols-[1fr_auto_auto] " +
                      "items-center gap-2"
                    }
                  >
                    <code
                      className={
                        "block overflow-x-auto whitespace-nowrap " +
                        "rounded-xl border border-white/20" +
                        "bg-white/60 p-3 font-mono text-xs" +
                        "dark:border-white/10 dark:bg-white/[0.04]"
                      }
                    >
                      {showSecret ? createdSecret : "•".repeat(48)}
                    </code>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecret(!showSecret)}
                      className="rounded-xl"
                    >
                      {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopySecret}
                      className="rounded-xl"
                    >
                      {copied ? (
                        <Check
                          size={14}
                          className="text-emerald-500"
                        />
                      ) : (
                        <Copy size={14} />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                onClick={() => {
                  setIsCreateOpen(false);
                  setCreatedSecret(null);
                  setShowSecret(false);
                }}
                className="rounded-xl"
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revoke Confirmation */}
        <AlertDialog
          open={!!revokeTarget}
          onOpenChange={(open) => !open && setRevokeTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke M2M Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to revoke the client &quot;
                {revokeTarget?.clientName}&quot;? This action cannot be undone.
                Any services using this Client ID and Secret will lose access
                immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevoke}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revokeMutation.isPending ? "Revoking..." : "Revoke Client"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Rotate Secret Confirmation */}
        <AlertDialog
          open={!!rotateTarget}
          onOpenChange={(open) => !open && setRotateTarget(null)}
        >
          <AlertDialogContent className="backdrop-blur-2xl dark:border-white/10 sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <RefreshCw
                  size={18}
                  className="text-amber-500"
                />
                Rotate Client Secret
              </AlertDialogTitle>
              <AlertDialogDescription>
                Rotating the secret for &quot;{rotateTarget?.clientName}&quot;
                will generate a new secret and **immediately invalidate** the
                old one. Applications will need to be updated with the new
                secret.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRotate}
                className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
              >
                {rotateMutation.isPending ? "Rotating..." : "Rotate Secret"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Verify M2M Client Modal */}
        <Dialog
          open={!!verifyTarget}
          onOpenChange={(open) => {
            if (!open) {
              setVerifyTarget(null);
            }
          }}
        >
          <DialogContent className="backdrop-blur-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Verify M2M Client</DialogTitle>
              <DialogDescription>
                Confirm verification for client &quot;
                {verifyTarget?.clientName}&quot;.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div
                className={
                  "flex items-center justify-between " +
                  "rounded-xl border border-border bg-muted/20 p-4"
                }
              >
                <div className="space-y-0.5">
                  <label className="text-sm font-bold text-foreground">
                    Grant Student Personal Info Access
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Allow access to addresses, contacts, and student profiles.
                  </p>
                </div>
                <Switch
                  checked={verifyPersonalInfo}
                  onCheckedChange={setVerifyPersonalInfo}
                  className="min-w-1/2"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setVerifyTarget(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!verifyTarget) return;
                  await handleVerify(verifyTarget.id, verifyPersonalInfo);
                  setVerifyTarget(null);
                }}
              >
                Verify & Grant Access
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
