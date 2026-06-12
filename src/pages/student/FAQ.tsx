import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileText,
  HelpCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AnimationStyles } from "@/components/ui/animations";
import { usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";

type FAQCategory = {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  iconStyle: string;
  questions: {
    question: string;
    answer: string;
  }[];
};

const faqCategories: FAQCategory[] = [
  {
    title: "Appointments",
    description:
      "Scheduling, status tracking, and reminders for guidance sessions.",
    icon: CalendarDays,
    gradient: "from-blue-500/15 via-sky-500/5 to-transparent",
    iconStyle:
      "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    questions: [
      {
        question: "How do I schedule an appointment?",
        answer:
          "Go to Appointments, choose Schedule Appointment, select your preferred available date and time, then submit the form. You can view the request under your appointment list after submission.",
      },
      {
        question: "Can I still change my selected schedule?",
        answer:
          "Yes, but only when the appointment is still pending or when the Guidance Office asks you to reschedule. Always check the appointment status before making another request.",
      },
      {
        question: "What do the appointment statuses mean?",
        answer:
          "Pending means your request is waiting for review, Approved means it has been accepted, Rescheduled means the Guidance Office provided a new schedule, Completed means the session is done, and Cancelled means it will no longer proceed.",
      },
    ],
  },
  {
    title: "Admission Slips",
    description: "Submission guidance for excuse or admission slip requests.",
    icon: FileText,
    gradient: "from-emerald-500/15 via-green-500/5 to-transparent",
    iconStyle:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    questions: [
      {
        question: "How do I submit an admission slip?",
        answer:
          "Open Admission Slips, click Submit Admission Slip, complete the required details, upload the needed attachment if applicable, then submit your request for review.",
      },
      {
        question: "What should I check before submitting?",
        answer:
          "Make sure your reason, dates, class details, and uploaded documents are correct. Clear and complete information helps the Guidance Office review the request faster.",
      },
      {
        question: "How will I know if my slip was approved?",
        answer:
          "Check the status from your Admission Slips page. The system will show whether the request is pending, approved, rejected, or needs further action.",
      },
    ],
  },
  {
    title: "IIR Profile",
    description: "Individual Inventory Record completion and profile updates.",
    icon: ClipboardList,
    gradient: "from-rose-500/15 via-red-500/5 to-transparent",
    iconStyle:
      "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    questions: [
      {
        question: "Why do I need to complete my IIR first?",
        answer:
          "The IIR helps the Guidance Office understand your academic, personal, family, and health background. Some student services are restricted until the required IIR information is completed.",
      },
      {
        question: "Can I update my IIR after submitting it?",
        answer:
          "Yes. Go to My IIR Profile and choose the available edit or update option. Keep your information accurate, especially if there are changes in your contact, family, or academic details.",
      },
      {
        question: "What should I do if my IIR information is incomplete?",
        answer:
          "Open the IIR form again and review each section carefully. Complete the missing required fields before accessing other student services.",
      },
    ],
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Record<string, number | null>>({});

  const totalQuestions = faqCategories.reduce(
    (sum, category) => sum + category.questions.length,
    0,
  );

  const pageMeta = useMemo(
    () => ({
      title: "Student FAQs",
      description:
        "Quick answers for appointments, admission slips, and IIR concerns.",
      badgeText: "Help Center",
      badgeIcon: <HelpCircle className="h-4 w-4" />,
      showDate: false,
      headerStats: (
        <div className="hidden grid-cols-2 gap-3 sm:grid">
          <div
            className={cn(
              "rounded-xl border border-white/30 bg-white/60 px-4 py-3",
              "backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]",
            )}
          >
            <p
              className={cn(
                "text-center text-[11px] font-medium uppercase",
                "tracking-[0.18em] text-muted-foreground",
              )}
            >
              Topics
            </p>
            <p className="mt-1 text-center text-2xl font-bold text-foreground">
              {faqCategories.length}
            </p>
          </div>

          <div
            className={cn(
              "rounded-xl border border-white/30 bg-white/60 px-4 py-3",
              "backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]",
            )}
          >
            <p
              className={cn(
                "text-center text-[11px] font-medium uppercase",
                "tracking-[0.18em] text-muted-foreground",
              )}
            >
              FAQs
            </p>
            <p className="mt-1 text-center text-2xl font-bold text-foreground">
              {totalQuestions}
            </p>
          </div>
        </div>
      ),
    }),
    [totalQuestions],
  );

  usePageMetadata(pageMeta);

  const toggleItem = (categoryTitle: string, questionIndex: number) => {
    setOpenItems((current) => ({
      ...current,
      [categoryTitle]:
        current[categoryTitle] === questionIndex ? null : questionIndex,
    }));
  };

  return (
    <div className={cn("mx-auto flex w-full flex-col", "px-4 sm:px-6 md:px-8")}>
      <AnimationStyles />

      <section
        className={cn(
          "relative overflow-hidden rounded-[22px] border border-white/25",
          "bg-white/45 px-4 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.05)]",
          "backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]",
          "sm:px-5 sm:py-5",
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -right-16 -top-20 h-28 w-28 rounded-full",
            "bg-primary/10 blur-3xl dark:bg-primary/15",
          )}
        />

        <div
          className={cn(
            "pointer-events-none absolute -bottom-20 left-8 h-28 w-28 rounded-full",
            "bg-secondary/20 blur-3xl dark:bg-secondary/10",
          )}
        />

        <div className="relative max-w-3xl space-y-1.5">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border",
              "border-primary/15 bg-primary/10 px-2.5 py-0.5 text-[10px]",
              "font-semibold uppercase tracking-[0.15em] text-primary",
            )}
          >
            <Sparkles className="h-2.5 w-2.5" />
            Student Help Desk
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Frequently Asked Questions
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm">
              Find quick answers about appointments, admission slips, and IIR
              records.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid items-start gap-5 xl:grid-cols-3">
        {faqCategories.map((category) => {
          const isCategoryOpen =
            openItems[category.title] !== null &&
            openItems[category.title] !== undefined;

          return (
            <Card
              key={category.title}
              className={cn(
                "overflow-hidden rounded-[26px] border border-white/25",
                "bg-white/55 shadow-[0_16px_36px_rgba(15,23,42,0.06)]",
                "backdrop-blur-xl transition-all duration-200",
                "dark:border-white/10 dark:bg-white/[0.04]",
                isCategoryOpen ? "h-auto min-h-[335px]" : "h-[335px]",
              )}
            >
              <CardContent className="flex h-full flex-col p-0">
                <div className="relative min-h-[130px] overflow-hidden p-5">
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br",
                      category.gradient,
                    )}
                  />

                  <div className="relative flex items-start gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                        "border shadow-sm backdrop-blur-xl",
                        category.iconStyle,
                      )}
                    >
                      <category.icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {category.title}
                        </h3>

                        <span
                          className={cn(
                            "rounded-full border border-white/30 bg-white/55 px-2.5 py-1",
                            "text-[11px] font-medium text-muted-foreground",
                            "backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]",
                          )}
                        >
                          {category.questions.length} questions
                        </span>
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-1.5 border-t border-white/25 p-4 dark:border-white/10">
                  {category.questions.map((item, index) => {
                    const isOpen = openItems[category.title] === index;

                    return (
                      <div
                        key={item.question}
                        className={cn(
                          "overflow-hidden rounded-2xl border transition-all duration-200",
                          isOpen
                            ? "border-primary/20 bg-primary/[0.04] shadow-sm"
                            : "border-white/25 bg-white/45 hover:border-white/40 hover:bg-white/65",
                          "dark:border-white/10 dark:bg-white/[0.035]",
                          "dark:hover:bg-white/[0.06]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(category.title, index)}
                          aria-expanded={isOpen}
                          className={cn(
                            "flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-2",
                            "text-left transition-colors",
                          )}
                        >
                          <p className="min-w-0 flex-1 line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                            {item.question}
                          </p>

                          <span
                            className={cn(
                              "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2.5",
                              "text-[11px] font-semibold transition-all duration-200",
                              isOpen
                                ? "border-primary/25 bg-primary/10 text-primary"
                                : "border-white/30 bg-white/80 text-muted-foreground hover:bg-white hover:text-foreground",
                              "dark:border-white/10 dark:bg-white/[0.07]",
                            )}
                          >
                            {isOpen ? "Hide" : "Show"}
                            <ChevronDown
                              className={cn(
                                "h-3 w-3 transition-transform duration-200",
                                isOpen && "rotate-180",
                              )}
                            />
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4">
                            <div
                              className={cn(
                                "rounded-xl border border-white/25 bg-white/65",
                                "px-4 py-3 text-sm leading-6 text-muted-foreground",
                                "shadow-sm backdrop-blur-xl",
                                "dark:border-white/10 dark:bg-white/[0.05]",
                              )}
                            >
                              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                                Answer
                              </p>
                              {item.answer}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section
        className={cn(
          "mt-6 rounded-[24px] border border-white/25 bg-white/45 p-5",
          "shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl",
          "dark:border-white/10 dark:bg-white/[0.04] sm:p-6",
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-[0.18em]",
                "text-muted-foreground",
              )}
            >
              Reminder
            </p>

            <h3 className="mt-1 text-lg font-semibold text-foreground">
              For urgent or sensitive concerns, contact the Guidance Office
              directly.
            </h3>
          </div>

          <div
            className={cn(
              "w-fit rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3",
              "text-sm font-medium text-primary",
            )}
          >
            Frequently asked questions are informational and static.
          </div>
        </div>
      </section>
    </div>
  );
}