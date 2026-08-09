import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileText,
  HelpCircle,
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
      {
        question: "What should I do once my appointment schedule is approved?",
        answer:
          "Once your appointment schedule is approved, you must physically visit the Guidance Office.",
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
        question: "What is an admission slip used for?",
        answer:
          "An admission slip serves as an official excuse slip for your absences.",
      },
      {
        question: "Can students revise a submitted admission slip?",
        answer:
          "Yes, students have the privilege to revise their submitted admission slips if needed.",
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
              "border-glass rounded-xl border border-glass-border px-4 py-3",
              "backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]",
              "animate-fade-in-up",
            )}
            style={{ animationDelay: "0.10s", animationFillMode: "both" }}
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
              "border-glass rounded-xl border border-glass-border px-4 py-3",
              "backdrop-blur-md dark:border-white/10 dark:bg-white/[0.05]",
              "animate-fade-in-up",
            )}
            style={{ animationDelay: "0.15s", animationFillMode: "both" }}
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

      <section className="mt-6 grid items-start gap-6 xl:grid-cols-3">
        {faqCategories.map((category, categoryIndex) => {
          return (
            <Card
              key={category.title}
              className={cn(
                "h-fit w-full overflow-hidden rounded-[28px]",
                "border border-white/30 bg-white/60",
                "shadow-[0_18px_42px_rgba(15,23,42,0.08)] backdrop-blur-xl",
                "transition-all duration-300 hover:-translate-y-0.5",
                "hover:shadow-[0_20px_46px_rgba(15,23,42,0.10)]",
                "animate-fade-in-up dark:border-white/10 dark:bg-white/[0.04]",
              )}
              style={{
                animationDelay: `${0.05 * (categoryIndex + 1)}s`,
                animationFillMode: "both",
              }}
            >
              <CardContent className="flex h-fit flex-col p-0">
                <div className="relative min-h-[140px] overflow-hidden px-8 pb-7 pt-7">
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br",
                      category.gradient,
                    )}
                  />

                  <div className="relative flex items-start gap-5">
                    <div
                      className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                        "border shadow-sm backdrop-blur-xl",
                        category.iconStyle,
                      )}
                    >
                      <category.icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex min-h-[30px] flex-wrap items-center gap-2.5">
                        <h3 className="text-xl font-bold tracking-tight text-foreground">
                          {category.title}
                        </h3>

                        <span
                          className={cn(
                            "rounded-full border border-white/40 bg-white/65 px-3 py-1",
                            "text-xs font-medium text-muted-foreground",
                            "shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06]",
                          )}
                        >
                          {category.questions.length} questions
                        </span>
                      </div>

                      <p className="mt-2 max-w-[330px] text-sm leading-6 text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 px-8 pb-8 pt-7">
                  {category.questions.map((item, questionIndex) => {
                    const isOpen = openItems[category.title] === questionIndex;

                    return (
                      <div
                        key={item.question}
                        className={cn(
                          "rounded-2xl border transition-all duration-200",
                          isOpen
                            ? "border-primary/20 bg-primary/[0.045] shadow-sm"
                            : "border-transparent bg-transparent hover:border-white/50 hover:bg-white/60",
                          "dark:hover:border-white/10 dark:hover:bg-white/[0.035]",
                        )}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            toggleItem(category.title, questionIndex)
                          }
                          className={cn(
                            "grid min-h-[50px] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4",
                            "px-4 py-3 text-left transition-colors",
                          )}
                        >
                          <span className="min-w-0 text-sm font-semibold leading-5 text-foreground">
                            {item.question}
                          </span>

                          <span
                            className={cn(
                              "inline-flex w-[70px] shrink-0 items-center justify-end gap-1.5",
                              "text-xs font-semibold text-muted-foreground transition-colors",
                              isOpen && "text-primary",
                            )}
                          >
                            {isOpen ? "Hide" : "Show"}
                            <ChevronDown
                              className={cn(
                                "h-3.5 w-3.5 transition-transform duration-300",
                                isOpen && "rotate-180",
                              )}
                            />
                          </span>
                        </button>

                        <div
                          className={cn(
                            "grid transition-all duration-300 ease-in-out",
                            isOpen
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0",
                          )}
                        >
                          <div className="overflow-hidden">
                            <div
                              className={cn(
                                "break-words px-4 pb-4 pt-0 text-sm leading-7 text-muted-foreground",
                              )}
                            >
                              {item.answer}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
