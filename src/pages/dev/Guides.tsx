import React, { useState } from "react";
import { usePageMetadata } from "@/context";
import {
  Terminal,
  Server,
  Copy,
  Check,
  ChevronRight,
  Layers,
  Cpu,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const Guides: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"laravel" | "php" | "curl">(
    "laravel",
  );
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  usePageMetadata({
    title: "Implementation Guides",
    description:
      "Get up and running in minutes with our ready-to-use code snippets for popular frameworks and languages.",
    badgeText: "Developer Tools",
    badgeIcon: <Terminal className="h-3.5 w-3.5" />,
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const snippets = {
    laravel: {
      title: "Laravel (HTTP Client)",
      desc: "Use the built-in Guzzle wrapper to make authenticated requests.",
      code: `use Illuminate\\Support\\Facades\\Http;

$response = Http::withToken('YOUR_TOKEN')
    ->get('${import.meta.env.VITE_API_BASE_URL}/integrations/students/profiles', [
        'page' => 1,
        'page_size' => 10
    ]);

if ($response->successful()) {
    $students = $response->json()['data'];
}`,
    },
    php: {
      title: "Native PHP (cURL)",
      desc: "Standard cURL implementation for legacy PHP environments.",
      code: `<?php
$ch = curl_init('${import.meta.env.VITE_API_BASE_URL}/integrations/students/profiles');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_TOKEN',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$data = json_decode($response, true);
curl_close($ch);`,
    },
    curl: {
      title: "cURL / CLI",
      desc: "Quick testing from your terminal or shell scripts.",
      code: `curl -X GET "${import.meta.env.VITE_API_BASE_URL}/integrations/students/profiles" \\
     -H "Authorization: Bearer YOUR_TOKEN" \\
     -H "Content-Type: application/json"`,
    },
  };

  return (
    <div className="animate-in fade-in mx-auto max-w-5xl duration-500">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Navigation Sidebar */}
        <div className="space-y-3">
          {[
            { id: "laravel", name: "Laravel 10+", icon: <Layers size={18} /> },
            { id: "php", name: "Native PHP", icon: <Server size={18} /> },
            { id: "curl", name: "cURL / CLI", icon: <Terminal size={18} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex w-full items-center justify-between rounded-lg border p-4 transition-all ${
                activeTab === item.id
                  ? "border-primary/30 bg-primary/10 text-primary shadow-lg shadow-primary/5"
                  : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-semibold">{item.name}</span>
              </div>
              <ChevronRight
                size={16}
                className={activeTab === item.id ? "opacity-100" : "opacity-0"}
              />
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="space-y-6 lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="glass-card space-y-4 p-8">
                <h2 className="text-3xl uppercase leading-none tracking-tight">
                  {snippets[activeTab].title}
                </h2>
                <p className="font-medium text-muted-foreground">
                  {snippets[activeTab].desc}
                </p>

                <div className="group relative">
                  <div className="absolute right-4 top-4 z-10 flex gap-2">
                    <button
                      onClick={() => copyCode(snippets[activeTab].code)}
                      className="rounded-lg border border-white/10 bg-white/10 p-2 text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/20"
                    >
                      {copied ? (
                        <Check
                          size={16}
                          className="text-success-foreground"
                        />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded-lg border border-white/10 bg-[#0a0a0a] p-6 pt-12 font-mono text-sm text-amber-200 selection:bg-primary/30">
                    <code>{snippets[activeTab].code}</code>
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div
                  className={cn(
                    "min-w-0 space-y-3 rounded-lg border",
                    "border-white/5 bg-glass-bg p-6 shadow-md",
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Globe size={18} />
                  </div>
                  <h4 className="font-bold uppercase tracking-tight">
                    Base URL
                  </h4>
                  <div
                    className={cn(
                      "flex items-center justify-between gap-2",
                      "rounded-lg border border-white/10 bg-muted/30 px-3 py-1.5",
                    )}
                  >
                    <code
                      className={cn(
                        "truncate font-mono text-xs",
                        "text-muted-foreground",
                      )}
                    >
                      {import.meta.env.VITE_API_BASE_URL}
                    </code>
                    <button
                      onClick={() =>
                        copyUrl(`${import.meta.env.VITE_API_BASE_URL}`)
                      }
                      className={cn(
                        "text-muted-foreground transition-colors",
                        "hover:text-foreground",
                      )}
                      type="button"
                    >
                      {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div
                  className={cn(
                    "min-w-0 space-y-3 rounded-lg border",
                    "border-white/5 bg-glass-bg p-6 shadow-md",
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                    <Cpu size={18} />
                  </div>
                  <h4 className="font-bold uppercase tracking-tight">
                    Authentication
                  </h4>
                  <p className="text-[10px] text-xs font-medium uppercase text-muted-foreground">
                    Bearer Token Auth
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Guides;
