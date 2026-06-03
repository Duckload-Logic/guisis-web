import React, { useState, useEffect } from "react";
import { usePageMetadata } from "@/context";
import { docsService } from "@/features/dev-tools/docs/services/api";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Book,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SearchInput from "@/components/form/SearchInput";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Endpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  parameters: any[];
  responses: any;
  tags: string[];
}

const Documentation: React.FC = () => {
  const [docs, setDocs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSchema, setSelectedSchema] = useState<{
    name: string;
    schema: any;
  } | null>(null);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  usePageMetadata({
    title: "API Reference",
    description:
      "Everything you need to integrate student data into your capstone system. Use your M2M Client ID and Secret to authenticate.",
    badgeText: "Developer Tools",
    badgeIcon: <Book className="h-3.5 w-3.5" />,
  });

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const resp = await docsService.getIntegrationDocs();
        setDocs(resp.data);
      } catch (err) {
        setError(
          "Failed to load documentation. Please ensure the API is running.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const toggleEndpoint = (id: string) => {
    const next = new Set(expandedEndpoints);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedEndpoints(next);
  };

  const getEndpoints = (): Endpoint[] => {
    if (!docs?.paths) return [];
    const endpoints: Endpoint[] = [];
    Object.entries(docs.paths).forEach(([path, methods]: [string, any]) => {
      Object.entries(methods).forEach(([method, detail]: [string, any]) => {
        endpoints.push({
          path,
          method: method.toUpperCase(),
          summary: detail.summary,
          description: detail.description,
          parameters: detail.parameters || [],
          responses: detail.responses || {},
          tags: detail.tags || [],
        });
      });
    });
    return endpoints.filter(
      (e) =>
        e.path.toLowerCase().includes(search.toLowerCase()) ||
        e.summary.toLowerCase().includes(search.toLowerCase()),
    );
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-success-foreground bg-success-background border-success-foreground/20";
      case "POST":
        return "text-info-foreground bg-info-background border-info-foreground/20";
      case "PUT":
        return "text-warning-foreground bg-warning-background border-warning-foreground/20";
      case "DELETE":
        return "text-danger-foreground bg-danger-background border-danger-foreground/20";
      default:
        return "text-muted-foreground bg-muted border-border";
    }
  };

  const resolveSchema = (schema: any, depth = 0): any => {
    if (depth > 12 || !schema || typeof schema !== "object") return schema;

    if (schema.$ref) {
      const ref = schema.$ref.replace("#/definitions/", "");
      const definition = docs.definitions?.[ref];
      return definition ? resolveSchema(definition, depth + 1) : schema;
    }

    if (schema.type === "array" && schema.items) {
      return [resolveSchema(schema.items, depth + 1)];
    }

    if (schema.properties) {
      const resolvedProps: any = {};
      Object.keys(schema.properties).forEach((key) => {
        resolvedProps[key] = resolveSchema(schema.properties[key], depth + 1);
      });
      return resolvedProps;
    }

    return schema;
  };

  const handleOpenSchema = (name: string, schema: any) => {
    const resolved = resolveSchema(schema);
    setSelectedSchema({ name, schema: resolved });
    setIsSchemaModalOpen(true);
  };

  const getExampleCurl = (endpoint: Endpoint) => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;

    let curl = `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}"`;

    // Add Headers
    curl += ` \\\n  -H "Content-Type: application/json"`;

    if (endpoint.path.startsWith("/integrations/students")) {
      curl += ` \\\n  -H "Authorization: Bearer <your_access_token>"`;
    }

    // Add Body for POST/PUT
    if (endpoint.method === "POST" || endpoint.method === "PUT") {
      let body = {};
      if (endpoint.path === "/auth/m2m/token") {
        body = {
          clientId: "your_client_id",
          clientSecret: "your_client_secret",
        };
      } else if (endpoint.path === "/auth/m2m/refresh") {
        body = { refreshToken: "your_refresh_token" };
      } else {
        // Try to infer from parameters if they are 'body'
        const bodyParam = endpoint.parameters.find((p) => p.in === "body");
        if (bodyParam && bodyParam.schema) {
          const resolved = resolveSchema(bodyParam.schema);
          if (resolved && resolved.properties) {
            Object.keys(resolved.properties).forEach((key) => {
              (body as any)[key] =
                resolved.properties[key].type === "string" ? "string" : 0;
            });
          }
        }
      }

      if (Object.keys(body).length > 0) {
        curl += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
      }
    }

    return curl;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading)
    return (
      <div className="flex h-96 flex-col items-center justify-center space-y-4">
        <Loader2
          className="animate-spin text-primary"
          size={40}
        />
        <p className="animate-pulse text-muted-foreground">
          Parsing API Specifications...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="glass-card space-y-4 p-12 text-center">
        <AlertCircle
          className="text-danger mx-auto"
          size={40}
        />
        <h3 className="text-xl font-bold">Documentation Offline</h3>
        <p className="mx-auto max-w-md text-muted-foreground">{error}</p>
      </div>
    );

  const endpoints = getEndpoints();

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <SearchInput
        hasHeader={false}
        placeholder="Search endpoints, paths, or keywords..."
        searchTerm={search}
        onSearchChange={setSearch}
      />

      <div className="space-y-6">
        {endpoints.map((endpoint) => {
          const id = `${endpoint.method}-${endpoint.path}`;
          const isExpanded = expandedEndpoints.has(id);

          return (
            <div
              key={id}
              className="group overflow-hidden rounded-xl border-glass-border bg-glass-bg shadow-md transition-all hover:border-white/10"
            >
              <button
                onClick={() => toggleEndpoint(id)}
                className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <span
                    className={`rounded-md border px-3 py-1 text-xs font-bold ${getMethodColor(endpoint.method)}`}
                  >
                    {endpoint.method}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="font-mono text-[10px] text-muted-foreground/90">
                      {endpoint.path}
                    </span>
                    <span className="text-xl font-bold">
                      {endpoint.summary}
                    </span>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="text-muted-foreground" />
                ) : (
                  <ChevronRight className="text-muted-foreground" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-8 border-t border-white/5 bg-white/[0.01] px-6 pb-8 pt-6">
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold uppercase text-primary/80">
                          Description
                        </h4>
                        <p className="leading-relaxed text-muted-foreground">
                          {endpoint.description}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold uppercase text-primary/80">
                            Example Request
                          </h4>
                          <button
                            onClick={() =>
                              handleCopy(id, getExampleCurl(endpoint))
                            }
                            className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground transition-colors hover:text-primary"
                          >
                            {copiedId === id ? (
                              <>
                                <Check
                                  size={12}
                                  className="text-success-foreground"
                                />{" "}
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy size={12} /> Copy Curl
                              </>
                            )}
                          </button>
                        </div>
                        <div className="group/code overflow-x-auto rounded-xl border border-white/5 bg-black p-4">
                          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-blue-300">
                            {getExampleCurl(endpoint)}
                          </pre>
                        </div>
                      </div>

                      {endpoint.parameters.length > 0 && (
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold uppercase text-primary/80">
                            Parameters
                          </h4>
                          <div className="space-y-3">
                            {endpoint.parameters.map(
                              (param: any, pIdx: number) => (
                                <div
                                  key={pIdx}
                                  className="flex gap-4 rounded-xl border border-white/5 bg-white/5 p-4"
                                >
                                  <div className="flex w-32 flex-col gap-1 border-r border-white/5 pr-4">
                                    <span className="font-mono text-sm font-bold text-primary">
                                      {param.name}
                                    </span>
                                    <span className="text-[10px] uppercase text-muted-foreground">
                                      {param.in}
                                    </span>
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium uppercase text-blue-400">
                                        {param.type}
                                      </span>
                                      {param.required && (
                                        <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-500">
                                          Required
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {param.description}
                                    </p>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase text-primary/80">
                          Responses
                        </h4>
                        <div className="grid gap-3">
                          {Object.entries(endpoint.responses).map(
                            ([code, res]: [string, any]) => (
                              <div
                                key={code}
                                className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-4"
                              >
                                <div className="flex items-center gap-4">
                                  <span
                                    className={`w-12 text-center text-sm font-bold ${code.startsWith("2") ? "text-success-foreground" : "text-danger-foreground"}`}
                                  >
                                    {code}
                                  </span>
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {res.description}
                                  </span>
                                </div>
                                {res.schema && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenSchema(
                                        `${endpoint.method} ${endpoint.path} - ${code} Response`,
                                        res.schema,
                                      );
                                    }}
                                    className="flex items-center gap-2 rounded border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase text-primary transition-all hover:bg-primary/10"
                                  >
                                    View Schema <ExternalLink size={10} />
                                  </button>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      <Dialog
        open={isSchemaModalOpen}
        onOpenChange={setIsSchemaModalOpen}
      >
        <DialogContent
          className={cn(
            "flex max-h-[80vh] max-w-2xl flex-col p-0",
            "border-white/5 bg-glass-bg backdrop-blur-md",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-between",
              "border-b border-white/5 p-6",
            )}
          >
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold">
                Schema Definition
              </DialogTitle>
              {(() => {
                const descCls = "font-mono text-xs text-muted-foreground";
                return (
                  <DialogDescription className={descCls}>
                    {selectedSchema?.name}
                  </DialogDescription>
                );
              })()}
            </div>
            <button
              onClick={() => setIsSchemaModalOpen(false)}
              className="rounded-lg p-2 transition-colors hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="custom-scrollbar overflow-y-auto p-6">
            <div
              className={cn(
                "overflow-x-auto rounded-xl border",
                "border-white/5 bg-black/40 p-6",
              )}
            >
              <pre className="font-mono text-sm leading-relaxed">
                {selectedSchema &&
                  JSON.stringify(selectedSchema.schema, null, 2)}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documentation;
