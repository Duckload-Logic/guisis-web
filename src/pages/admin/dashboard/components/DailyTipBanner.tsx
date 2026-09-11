import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TIP_QUOTES = [
  "Data-driven guidance is effective; review student notes before sessions.",
  "A brief check before consultations fosters calmer, grounded discussions.",
  "Regular follow-ups turn single appointments into lasting guidance.",
  "Clear record keeping makes future counseling faster and more accurate.",
  "Timely updates to case notes help build reliable student histories.",
  "Prepared counselors create confident and reassuring spaces for students.",
];

export function DailyTipBanner() {
  const [showDailyTip, setShowDailyTip] = useState(false);

  const dailyTip = useMemo(() => {
    const dayIndex = new Date().getDate() % TIP_QUOTES.length;
    return TIP_QUOTES[dayIndex];
  }, []);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const lastShownDate = localStorage.getItem("dashboard-tip-date");

    if (lastShownDate !== todayKey) {
      setShowDailyTip(true);
      localStorage.setItem("dashboard-tip-date", todayKey);
    }
  }, []);

  return (
    <AnimatePresence>
      {showDailyTip && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "relative flex items-center justify-between overflow-hidden",
            "rounded-2xl border border-glass-border bg-card/60 p-4",
            "shadow-xs backdrop-blur-xl sm:p-5",
          )}
        >
          <div className="flex items-center gap-3.5 pr-8">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center",
                "rounded-xl border border-glass-border bg-primary/10",
                "shadow-xs text-primary",
              )}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  "text-muted-foreground",
                )}
              >
                Daily Counseling Insight
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs font-medium italic text-foreground/90",
                  "sm:text-sm",
                )}
              >
                &ldquo;{dailyTip}&rdquo;
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDailyTip(false)}
            className={cn(
              "h-7 w-7 shrink-0 rounded-lg text-muted-foreground",
              "hover:bg-muted/60 hover:text-foreground",
            )}
            aria-label="Dismiss daily insight"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
