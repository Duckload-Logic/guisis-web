import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  KeyRound,
  Calendar,
  Clock,
  SlidersHorizontal,
  Info,
  FileText,
  RotateCcw,
} from "lucide-react";
import { usePageMetadata } from "@/context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { LabeledSwitch } from "@/components/ui/labeled-switch";
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
import { Checkbox } from "@/components/form";
import { formatDate } from "@/utils/dateTime";
import { cn } from "@/lib/utils";

type SortOrder = "asc" | "desc";

export default function M2MManagement() {
  const [includeRevoked, setIncludeRevoked] = useState(false);
  const [selectedSort, setSelectedSort] = useState<string>("createdAt");
  const [selectedOrder, setSelectedOrder] = useState<SortOrder>("desc");
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<M2MClient | null>(null);
  const [rotateTarget, setRotateTarget] = useState<M2MClient | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<M2MClient | null>(null);
  const [verifyPersonalInfo, setVerifyPersonalInfo] = useState(false);

  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const { data: rawClients = [], isLoading } = useM2MClients({
    includeRevoked: true,
  });

  const revokeMutation = useRevokeM2MClient();
  const rotateMutation = useRotateM2MSecret();
  const verifyMutation = useVerifyM2MClient();
  const rejectMutation = useRejectM2MClient();

  const toggleFlip = (id: number) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const clients = useMemo(() => {
    let list = rawClients ? [...rawClients] : [];
    if (!includeRevoked) {
      list = list.filter((c) => c.isActive);
    }
    return list.sort((a, b) => {
      let valA: any = a[selectedSort as keyof M2MClient] ?? "";
      let valB: any = b[selectedSort as keyof M2MClient] ?? "";
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (valA < valB) return selectedOrder === "asc" ? -1 : 1;
      if (valA > valB) return selectedOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [rawClients, includeRevoked, selectedSort, selectedOrder]);

  const activeClients = useMemo(
    () => rawClients.filter((c) => c.isActive),
    [rawClients],
  );
  const revokedClients = useMemo(
    () => rawClients.filter((c) => !c.isActive),
    [rawClients],
  );

  const isInitialPageLoading = isLoading && rawClients.length === 0;

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
    setIsCreateOpen(true);
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
        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 " +
        "border-emerald-500/20",
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
      value: rawClients.length,
      icon: Fingerprint,
      iconClass: "bg-primary/10 text-primary border-primary/20",
    },
  ];

  usePageMetadata({
    title: "M2M Management",
    isLoading: isInitialPageLoading,
    badgeText: "Infrastructure Access Control",
    badgeIcon: <Sparkles className="h-3.5 w-3.5" />,
    description:
      "Manage Machine-to-Machine clients for integration, " +
      "automation, and infrastructure services.",
  });

  const toggleSort = (sortKey: string) => {
    if (selectedSort === sortKey) {
      setSelectedOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSelectedSort(sortKey);
      setSelectedOrder("desc");
    }
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        {/* Telemetry Stat Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.label}
                className={cn(
                  "rounded-2xl border-glass-border bg-glass-bg shadow-sm",
                  "backdrop-blur-xl transition-all duration-300",
                  "hover:shadow-md hover:border-primary/30",
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {card.label}
                      </p>
                      <p className="text-4xl font-bold tabular-nums tracking-tight text-foreground">
                        {card.value}
                      </p>
                    </div>

                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center",
                        "rounded-xl border backdrop-blur-md",
                        card.iconClass,
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* M2M Management Control Header & Cards */}
        <Card className="rounded-2xl border border-glass-border bg-glass-bg p-6 shadow-sm backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
                <Fingerprint className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  M2M Clients
                </h2>
                <p className="text-xs text-muted-foreground">
                  View, verify, and manage machine integration identities.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Sort selector dropdown controls */}
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">
                  Sort:
                </span>
                <button
                  type="button"
                  onClick={() => toggleSort("clientName")}
                  className={cn(
                    "text-xs font-semibold transition-colors",
                    selectedSort === "clientName"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Name{" "}
                  {selectedSort === "clientName" &&
                    (selectedOrder === "asc" ? "↑" : "↓")}
                </button>
                <span className="text-muted-foreground/40">•</span>
                <button
                  type="button"
                  onClick={() => toggleSort("createdAt")}
                  className={cn(
                    "text-xs font-semibold transition-colors",
                    selectedSort === "createdAt"
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Created{" "}
                  {selectedSort === "createdAt" &&
                    (selectedOrder === "asc" ? "↑" : "↓")}
                </button>
              </div>

              <Checkbox
                id="show-revoked"
                label="Show revoked clients"
                name="show-revoked"
                checked={includeRevoked}
                onCheckedChange={() => setIncludeRevoked((prev) => !prev)}
              />
            </div>
          </div>

          {/* Cards Grid Section */}
          {clients?.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary backdrop-blur-md">
                <Fingerprint className="h-7 w-7" />
              </div>
              <p className="text-lg font-bold text-foreground">
                No M2M Clients Registered
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                No machine integration clients have been registered yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {clients.map((client) => {
                  const isFlipped = !!flippedCards[client.id];
                  return (
                    <motion.div
                      key={client.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className={cn(
                        "group relative flex min-h-[300px] flex-col justify-between",
                        "overflow-hidden rounded-2xl border border-glass-border",
                        "bg-glass-bg p-5 shadow-sm backdrop-blur-xl",
                        "transition-all duration-300 hover:border-primary/40",
                        "hover:shadow-xl dark:border-white/10",
                        !client.isActive && "opacity-75 grayscale-[0.2]",
                      )}
                    >
                      {/* Background glow accent on hover */}
                      <div
                        className={cn(
                          "pointer-events-none absolute -right-10 -top-10",
                          "h-32 w-32 rounded-full bg-primary/5 blur-2xl",
                          "transition-all duration-500 group-hover:bg-primary/15",
                        )}
                      />

                      {!isFlipped ? (
                        /* FRONT FACE */
                        <div className="relative z-10 flex h-full flex-col justify-between space-y-4">
                          {/* Client Header Info */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={cn(
                                  "flex h-11 w-11 shrink-0 items-center",
                                  "justify-center rounded-xl border",
                                  "backdrop-blur-md transition-transform",
                                  "group-hover:scale-105",
                                  client.isActive
                                    ? "border-emerald-500/20 bg-emerald-500/10 " +
                                        "text-emerald-600 dark:text-emerald-400"
                                    : "border-red-500/20 bg-red-500/10 " +
                                        "text-red-600 dark:text-red-400",
                                )}
                              >
                                <Fingerprint className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3
                                  className="truncate text-base font-bold tracking-tight text-foreground"
                                  title={client.clientName}
                                >
                                  {client.clientName}
                                </h3>
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  Client #{client.id}
                                </span>
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFlip(client.id)}
                              className={cn(
                                "h-8 w-8 min-h-0 shrink-0 rounded-xl",
                                "text-muted-foreground transition-colors",
                                "hover:bg-primary/10 hover:text-primary",
                              )}
                              title="Flip card for description & details"
                            >
                              <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
                            </Button>
                          </div>

                          {/* Status Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                                client.isActive
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                  : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
                              )}
                            >
                              <span
                                className={cn(
                                  "mr-1.5 inline-block h-1.5 w-1.5 rounded-full",
                                  client.isActive
                                    ? "bg-emerald-500 animate-pulse"
                                    : "bg-red-500",
                                )}
                              />
                              {client.isActive ? "Active" : "Revoked"}
                            </Badge>

                            <Badge
                              variant="outline"
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                                client.isVerified
                                  ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                              )}
                            >
                              {client.isVerified
                                ? "Verified"
                                : "Pending Verification"}
                            </Badge>

                            {client.isVerified && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                                  client.hasPersonalInfoAccess
                                    ? "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300"
                                    : "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
                                )}
                              >
                                {client.hasPersonalInfoAccess
                                  ? "PII: Allowed"
                                  : "PII: Denied"}
                              </Badge>
                            )}
                          </div>

                          {/* Client ID Code Snippet Box */}
                          <div
                            className={cn(
                              "flex items-center justify-between gap-2 rounded-xl border",
                              "border-border/60 bg-muted/30 p-2.5 backdrop-blur-md",
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <KeyRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-[11px] font-medium text-muted-foreground">
                                Client ID:
                              </span>
                              <code className="truncate font-mono text-[11px] font-semibold text-foreground">
                                {client.isVerified
                                  ? client.clientId
                                  : "••••••••••••••••"}
                              </code>
                            </div>
                            {client.isVerified && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 min-h-0 shrink-0 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    client.clientId,
                                  );
                                }}
                                title="Copy Client ID"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>

                          {/* Scopes Tag Cloud */}
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Granted Scopes
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {client.scopes && client.scopes.length > 0 ? (
                                client.scopes.map((scope) => (
                                  <Badge
                                    key={scope}
                                    variant="outline"
                                    className="rounded-lg border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
                                  >
                                    {scope}
                                  </Badge>
                                ))
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="rounded-lg border-muted/40 bg-muted/20 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                                >
                                  admin:full
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Timestamps Section */}
                          <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                              <span className="truncate">
                                Created: {formatDate(client.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center justify-end gap-1.5">
                              <Clock className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                              <span className="truncate">
                                Used:{" "}
                                {client.lastUsedAt
                                  ? formatDate(client.lastUsedAt)
                                  : "Never"}
                              </span>
                            </div>
                          </div>

                          {/* Card Actions Footer */}
                          <div className="relative z-10 mt-2 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                            {client.isActive && (
                              <>
                                {!client.isVerified ? (
                                  <div className="flex w-full items-center justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleReject(client.id)}
                                      className={cn(
                                        "h-8 min-h-0 gap-1.5 rounded-xl px-3 text-xs font-semibold",
                                        "border-red-500/20 text-destructive hover:bg-destructive/10",
                                      )}
                                      disabled={rejectMutation.isPending}
                                    >
                                      <Ban className="h-3.5 w-3.5 shrink-0" /> Reject
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setVerifyTarget(client);
                                        setVerifyPersonalInfo(
                                          client.hasPersonalInfoAccess,
                                        );
                                      }}
                                      className="h-8 min-h-0 gap-1.5 rounded-xl px-3 text-xs font-semibold shadow-sm"
                                      disabled={verifyMutation.isPending}
                                    >
                                      <Check className="h-3.5 w-3.5 shrink-0" /> Verify Client
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setVerifyTarget(client);
                                        setVerifyPersonalInfo(
                                          client.hasPersonalInfoAccess,
                                        );
                                      }}
                                      className={cn(
                                        "h-8 min-h-0 gap-1.5 rounded-xl px-3 text-xs font-semibold",
                                        "border-purple-500/30 text-purple-700 hover:bg-purple-500/10 dark:text-purple-300",
                                      )}
                                      title="Manage PII Access"
                                    >
                                      <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> PII
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setRotateTarget(client)}
                                      className="h-8 min-h-0 gap-1.5 rounded-xl px-3 text-xs font-semibold"
                                      title="Rotate Client Secret"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5 shrink-0" /> Rotate
                                    </Button>

                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setRevokeTarget(client)}
                                      className={cn(
                                        "h-8 w-8 min-h-0 rounded-xl p-0 text-destructive",
                                        "border-red-500/20 hover:bg-destructive/10",
                                      )}
                                      title="Revoke Client"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 shrink-0" />
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* BACK FACE */
                        <div className="relative z-10 flex h-full flex-col justify-between space-y-4">
                          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="h-4 w-4 shrink-0 text-primary" />
                              <h4 className="truncate text-sm font-bold text-foreground">
                                {client.clientName}
                              </h4>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFlip(client.id)}
                              className="h-8 w-8 min-h-0 shrink-0 rounded-xl text-primary hover:bg-primary/10"
                              title="Flip back to front"
                            >
                              <RotateCcw className="h-4 w-4 text-primary" />
                            </Button>
                          </div>

                          {/* Full Description Box */}
                          <div className="flex-1 space-y-2 overflow-y-auto max-h-[160px] pr-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Client Description & Purpose
                            </p>
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-foreground">
                              {client.clientDescription ||
                                "No description provided for this M2M client."}
                            </div>
                          </div>

                          {/* Metadata Summary */}
                          <div className="space-y-1.5 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Owner User ID:</span>
                              <code className="font-mono text-foreground">
                                {client.userId || "System"}
                              </code>
                            </div>
                            <div className="flex justify-between">
                              <span>Created Date:</span>
                              <span className="text-foreground">
                                {formatDate(client.createdAt)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Last Activity:</span>
                              <span className="text-foreground">
                                {client.lastUsedAt
                                  ? formatDate(client.lastUsedAt)
                                  : "Never"}
                              </span>
                            </div>
                          </div>

                          {/* Return Button */}
                          <div className="border-t border-border/40 pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleFlip(client.id)}
                              className="w-full gap-1.5 rounded-xl text-xs font-semibold"
                            >
                              <RotateCcw className="h-3.5 w-3.5 shrink-0" /> Return to Front
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
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
                        "rounded-xl border border-white/20 " +
                        "bg-white/60 p-3 font-mono text-xs " +
                        "dark:border-white/10 dark:bg-white/[0.04]"
                      }
                    >
                      {showSecret ? createdSecret : "•".repeat(48)}
                    </code>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSecret(!showSecret)}
                      className="h-10 w-10 min-h-0 rounded-xl"
                    >
                      {showSecret ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopySecret}
                      className="h-10 w-10 min-h-0 rounded-xl"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
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
                className={cn(
                  "rounded-xl bg-destructive text-destructive-foreground",
                  "hover:bg-destructive/90",
                )}
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
                <RefreshCw className="h-4 w-4 text-amber-500" />
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
          <DialogContent
            className={cn(
              "overflow-hidden rounded-xl border border-glass-border",
              "bg-background/95 p-0 shadow-md backdrop-blur-2xl",
              "sm:max-w-md",
            )}
          >
            <DialogHeader className="space-y-1.5 border-b border-border/60 px-6 py-5">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Verify M2M Client
              </DialogTitle>
              <DialogDescription className="text-sm leading-relaxed">
                Confirm verification for client &quot;
                {verifyTarget?.clientName}&quot;.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 py-5">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-4",
                  "border-border/70 bg-muted/30 shadow-md",
                  "transition-colors duration-200 hover:bg-muted/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center",
                    "rounded-xl border border-primary/15 bg-primary/10",
                  )}
                >
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>

                <label
                  htmlFor="grant-personal-info-access"
                  className="min-w-0 flex-1 cursor-pointer"
                >
                  <span className="block text-sm font-semibold leading-snug text-foreground">
                    Grant Student Personal Info Access
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    Allow access to addresses, contacts, and student profiles.
                  </span>
                </label>

                <LabeledSwitch
                  id="grant-personal-info-access"
                  checked={verifyPersonalInfo}
                  onCheckedChange={setVerifyPersonalInfo}
                  className="shrink-0"
                />
              </div>
            </div>

            <DialogFooter
              className={cn(
                "flex-row justify-end gap-2 border-t border-border/60",
                "bg-muted/20 px-6 py-4",
              )}
            >
              <Button
                variant="ghost"
                onClick={() => setVerifyTarget(null)}
                className="rounded-xl px-5"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!verifyTarget) return;
                  await handleVerify(verifyTarget.id, verifyPersonalInfo);
                  setVerifyTarget(null);
                }}
                className="rounded-xl px-5 shadow-md"
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
