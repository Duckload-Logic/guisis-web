import React, { useState, useEffect, useMemo } from "react";
import { usePageMetadata } from "@/context";
import { m2mService } from "@/features/dev-tools/m2m/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Loader2,
  Lock,
  Fingerprint,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from "@/components/ui/responsive-modal";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";

interface M2MClient {
  id: number;
  clientName: string;
  clientDescription: string;
  clientId: string;
  isActive: boolean;
  isVerified: boolean;
  hasPersonalInfoAccess: boolean;
  createdAt: string;
}

const M2MManagement: React.FC = () => {
  const [clients, setClients] = useState<M2MClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", description: "" });
  const [requestPersonalInfo, setRequestPersonalInfo] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<{
    id: string;
    secret: string;
  } | null>(null);
  const [createdClientData, setCreatedClientData] = useState<{
    client: M2MClient;
    secret: string;
  } | null>(null);
  const [showCreatedSecret, setShowCreatedSecret] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  usePageMetadata(
    useMemo(
      () => ({
        title: "Client Manager",
        description:
          "Manage machine-to-machine authentication for your capstone system.",
        badgeText: "Dev Portal",
        badgeIcon: <Lock className="h-3.5 w-3.5" />,
        headerActions: (
          <div className="group relative">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={clients.some((c) => c.isActive)}
              className={cn(
                "btn-primary flex items-center gap-2 px-6",
                "py-3 transition-all disabled:cursor-not-allowed",
                "disabled:opacity-50",
              )}
            >
              <Plus
                size={20}
                strokeWidth={3}
              />
              <span>Create New Client</span>
            </button>
            {clients.some((c) => c.isActive) && (
              <div
                className={cn(
                  "pointer-events-none absolute right-0 top-full",
                  "z-50 mt-2 w-64 rounded-xl border border-border",
                  "bg-card p-3 opacity-0 shadow-xl transition-opacity",
                  "group-hover:opacity-100",
                )}
              >
                <p
                  className={cn(
                    "text-[10px] font-bold leading-relaxed",
                    "text-amber-500",
                  )}
                >
                  Restriction: You already have an active client. Revoke it to
                  create a new one.
                </p>
              </div>
            )}
          </div>
        ),
      }),
      [clients],
    ),
  );

  const fetchClients = async () => {
    try {
      const resp = await m2mService.getClients();
      setClients(resp.data || []);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await m2mService.createClient({
        clientName: newClient.name,
        clientDescription: newClient.description,
        hasPersonalInfoAccess: requestPersonalInfo,
      });
      // Skip setting createdClientData to avoid showing the success modal
      // as verification is pending anyway.
      await fetchClients();
      setNewClient({ name: "", description: "" });
      setRequestPersonalInfo(false);
      setShowCreateModal(false); // Close the creation form
    } catch (err) {
      console.error("Failed to create client", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to revoke this client? This action cannot be undone.",
      )
    )
      return;
    try {
      await m2mService.deleteClient(id.toString());
      setClients(clients.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete client", err);
    }
  };

  const handleGenerateSecret = async (id: number) => {
    setGeneratingFor(id.toString());
    try {
      const resp = await m2mService.generateSecret(id.toString());
      setNewSecret({ id: id.toString(), secret: resp.data.clientSecret });
    } catch (err) {
      console.error("Failed to generate secret", err);
    } finally {
      setGeneratingFor(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="animate-in fade-in relative space-y-10 duration-500">
      {clients.some((c) => c.isActive) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/10 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 uppercase text-primary">
            <ShieldCheck size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold uppercase tracking-tight">
              Security Policy Active
            </p>
            <p className="text-xs font-medium text-muted-foreground underline decoration-primary/20">
              To protect student data from irresponsible use, we limit each
              developer to one active M2M client.
            </p>
          </div>
        </motion.div>
      )}

      {clients.some((c) => c.isActive && !c.isVerified) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 text-amber-600">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold uppercase tracking-tight text-amber-700">
              Verification Pending
            </p>
            <p className="text-xs font-medium leading-relaxed text-amber-600/80">
              Some of your clients are awaiting Superadmin approval. Sensitive
              information is hidden and API access is restricted until verified.
            </p>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "glass-card flex flex-col rounded-xl",
                "space-y-6 border border-glass-border p-6",
              )}
            >
              <div className="flex items-start justify-between">
                <Skeleton className="h-14 w-14 rounded-lg bg-muted/60" />
                <Skeleton className="h-8 w-8 rounded-lg bg-muted/60" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4 bg-muted/60" />
                <Skeleton className="h-4 w-5/6 bg-muted/60" />
              </div>
              <div className="space-y-2 pt-2">
                <Skeleton className="h-3 w-16 bg-muted/60" />
                <Skeleton className="h-10 w-full rounded-lg bg-muted/60" />
              </div>
              <div className="pt-2">
                <Skeleton className="h-8 w-32 rounded-lg bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="glass-card group relative flex flex-col items-center justify-center space-y-6 overflow-hidden p-24 text-center">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-5" />
          <div className="flex h-20 w-20 rotate-6 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-xl shadow-primary/10 transition-transform duration-500 group-hover:rotate-0">
            <Fingerprint size={40} />
          </div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">
              No clients yet
            </h3>
            <p className="max-w-sm font-medium leading-relaxed text-muted-foreground">
              Generate your first machine-to-machine client to start integrating
              with our secure student APIs.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-secondary flex items-center gap-2 px-8"
          >
            <Plus size={18} /> Get Started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <motion.div
              layout
              key={client.id}
              className={`glass-card group relative flex flex-col overflow-hidden rounded-xl border border-glass-border px-6 py-4 transition-all duration-300 hover:translate-y-[-6px] ${!client.isVerified ? "opacity-60 shadow-none grayscale-[0.5]" : ""}`}
            >
              <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/5 blur-3xl" />

              <div className="mb-6 flex items-start justify-between">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-lg bg-muted/50 text-primary shadow-inner transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30">
                  <ShieldCheck size={28} />
                  {!client.isVerified && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-amber-500 shadow-sm">
                      <AlertTriangle
                        size={10}
                        className="text-white"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg p-0 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div>
                  <h3 className="truncate text-xl font-bold tracking-tight">
                    {client.clientName}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-muted-foreground">
                    {client.clientDescription || "No description provided."}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase " +
                          "tracking-wider text-muted-foreground",
                      )}
                    >
                      Personal Info:
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] " +
                          "border font-bold",
                        client.hasPersonalInfoAccess
                          ? "border-emerald-500/10 bg-emerald-500/5 " +
                              "text-emerald-500"
                          : "border-muted/30 bg-muted/5 " +
                              "text-muted-foreground",
                      )}
                    >
                      {client.hasPersonalInfoAccess ? "Granted" : "Denied"}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <label className="px-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                      Client ID
                    </label>
                    <div className="group/item flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 pr-4 shadow-inner">
                      <code className="flex-1 truncate font-mono text-xs font-bold tracking-tight text-foreground">
                        {client.isVerified ? (
                          client.clientId
                        ) : (
                          <span className="italic">••••••••••••</span>
                        )}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(client.clientId, client.id.toString())
                        }
                        disabled={!client.isVerified}
                        className="rounded-lg border border-border bg-background p-2 text-muted-foreground transition-all hover:text-primary active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {copiedId === client.id.toString() ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="px-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
                      Client Secret
                    </label>
                    {newSecret?.id === client.id.toString() ? (
                      <div className="animate-in zoom-in-95 flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 shadow-inner">
                        <input
                          type={showCreatedSecret ? "text" : "password"}
                          readOnly
                          value={newSecret.secret}
                          className="flex-1 border-none bg-transparent font-mono text-xs font-bold text-emerald-500 focus:outline-none"
                        />
                        <button
                          onClick={() =>
                            setShowCreatedSecret(!showCreatedSecret)
                          }
                          className="rounded-lg bg-emerald-500/20 p-2 text-emerald-500 transition-all hover:bg-emerald-500/30 active:scale-90"
                        >
                          {showCreatedSecret ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              newSecret.secret,
                              "secret-" + client.id.toString(),
                            )
                          }
                          className="rounded-lg bg-emerald-500/20 p-2 text-emerald-500 transition-all hover:bg-emerald-500/30 active:scale-90"
                        >
                          {copiedId === "secret-" + client.id.toString() ? (
                            <Check size={16} />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                        <button
                          onClick={() => setNewSecret(null)}
                          className="rounded-lg bg-muted/50 p-2 text-muted-foreground transition-all hover:bg-muted active:scale-90"
                          title="Dismiss"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateSecret(client.id)}
                        disabled={
                          generatingFor === client.id.toString() ||
                          !client.isVerified
                        }
                        className="group/gen flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 text-xs font-bold transition-all hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {generatingFor === client.id.toString() ? (
                          <Loader2
                            className="animate-spin"
                            size={16}
                          />
                        ) : (
                          <>
                            <Plus
                              size={16}
                              className="text-primary transition-transform group-hover:scale-125"
                            />{" "}
                            Generate New Secret
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-5 border-t border-border pt-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                    <Clock
                      size={14}
                      className="text-muted-foreground/60"
                    />{" "}
                    {new Date(client.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase ${client.isActive ? (client.isVerified ? "border-emerald-500/10 bg-emerald-500/10 text-emerald-500" : "border-amber-500/10 bg-amber-500/10 text-amber-500") : "border-rose-500/10 bg-rose-500/10 text-rose-500"}`}
                  >
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${client.isActive ? (client.isVerified ? "animate-pulse bg-emerald-500" : "bg-amber-500") : "bg-rose-500"}`}
                    />
                    {client.isActive
                      ? client.isVerified
                        ? "Verified Active"
                        : "Pending Verification"
                      : "Revoked"}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <ResponsiveModal
        open={showCreateModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateModal(false);
            setCreatedClientData(null);
            setShowCreatedSecret(false);
          }
        }}
      >
        <ResponsiveModalContent
          hasCloseButton={false}
          className="max-w-lg p-10"
        >
          <ResponsiveModalHeader className="space-y-2 text-left">
            <ResponsiveModalTitle className="text-3xl tracking-tighter">
              {createdClientData
                ? "Client Created Successfully"
                : "Create M2M Client"}
            </ResponsiveModalTitle>
            <ResponsiveModalDescription
              className={cn("font-medium", "text-muted-foreground")}
            >
              {createdClientData
                ? "Please copy your client secret now. " +
                  "For security, we won't show it to you again."
                : "Authorize a new machine-to-machine application " +
                  "to integrate with the OGOS platform."}
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>

          {createdClientData ? (
            <div className="animate-in zoom-in-95 space-y-8 duration-300">
              <div
                className={cn(
                  "space-y-6 rounded-[2rem] border",
                  "border-emerald-500/20 bg-emerald-500/5 p-6",
                )}
              >
                <div className="space-y-2">
                  <label
                    className={cn(
                      "px-1 text-[10px] uppercase",
                      "tracking-[0.2em] text-muted-foreground/60",
                    )}
                  >
                    Client ID
                  </label>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-2xl",
                      "border border-border bg-background p-4 shadow-inner",
                    )}
                  >
                    <code
                      className={cn(
                        "flex-1 truncate font-mono text-sm",
                        "font-bold text-foreground",
                      )}
                    >
                      {createdClientData.client.clientId}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          createdClientData.client.clientId,
                          "created-id",
                        )
                      }
                      className={cn(
                        "rounded-xl bg-muted/50 p-2",
                        "text-muted-foreground transition-all",
                        "hover:text-primary",
                      )}
                    >
                      {copiedId === "created-id" ? (
                        <Check size={18} />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className={cn(
                      "px-1 text-[10px] uppercase",
                      "tracking-[0.2em] text-muted-foreground/60",
                    )}
                  >
                    Client Secret
                  </label>
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-2xl",
                      "border border-border bg-background p-4 shadow-inner",
                    )}
                  >
                    <input
                      type={showCreatedSecret ? "text" : "password"}
                      readOnly
                      value={createdClientData.secret}
                      className={cn(
                        "flex-1 border-none bg-transparent font-mono",
                        "text-sm font-bold text-emerald-500",
                        "focus:outline-none",
                      )}
                    />
                    <button
                      onClick={() => setShowCreatedSecret(!showCreatedSecret)}
                      className={cn(
                        "rounded-xl bg-muted/50 p-2",
                        "text-muted-foreground transition-all",
                        "hover:text-primary",
                      )}
                    >
                      {showCreatedSecret ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          createdClientData.secret,
                          "created-secret",
                        )
                      }
                      className={cn(
                        "rounded-xl bg-emerald-500/10 p-2 font-bold",
                        "text-emerald-500 transition-all",
                        "hover:bg-emerald-500/20",
                      )}
                    >
                      {copiedId === "created-secret" ? (
                        <Check size={18} />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "flex items-start gap-4 rounded-2xl border",
                  "border-amber-500/20 bg-amber-500/10 p-4",
                )}
              >
                <AlertTriangle
                  className="shrink-0 text-amber-500"
                  size={20}
                />
                <p
                  className={cn(
                    "text-xs font-bold leading-relaxed",
                    "text-amber-500/90",
                  )}
                >
                  Make sure to store this secret securely. You will not be able
                  to retrieve it later, though you can always generate a new
                  one.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreatedClientData(null);
                  setShowCreatedSecret(false);
                }}
                className="btn-primary w-full py-4 text-sm font-bold"
              >
                I've copied the secret
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleCreate}
              className="space-y-6"
            >
              <div className="space-y-2.5">
                <FormField
                  label="Application Name"
                  value={newClient.name}
                  required
                  onChange={(val) => setNewClient({ ...newClient, name: val })}
                  placeholder="e.g. Finance Analytics Service"
                />
              </div>
              <div className="space-y-2.5">
                <FormField
                  label="Purpose / Description"
                  isTextarea
                  value={newClient.description}
                  required
                  onChange={(val) =>
                    setNewClient({
                      ...newClient,
                      description: val,
                    })
                  }
                  placeholder={
                    "Explain how this application will use the " +
                    "available student endpoints."
                  }
                  maxChars={100}
                />
              </div>

              <div className="flex w-full justify-end gap-4 pt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  type="submit"
                >
                  Generate Client
                </Button>
              </div>
            </form>
          )}
        </ResponsiveModalContent>
      </ResponsiveModal>
    </div>
  );
};

export default M2MManagement;
