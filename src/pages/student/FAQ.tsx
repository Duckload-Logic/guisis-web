import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  HelpCircle,
  LifeBuoy,
  Search,
  SearchX,
  X,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimationStyles } from "@/components/ui/animations";
import { usePageMetadata } from "@/context";
import { cn } from "@/lib/utils";

type FAQItem = {
  question: string;
  answer: string;
};

type FAQCategory = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  questions: FAQItem[];
};

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    id: "appointments",
    title: "Appointments",
    description:
      "Scheduling, status tracking, and reminders for guidance sessions.",
    icon: CalendarDays,
    questions: [
      {
        question: "How do I schedule an appointment?",
        answer:
          "Go to Appointments, choose Schedule Appointment, select " +
          "your preferred available date and time, then submit the form. " +
          "You can view the request under your appointment list after " +
          "submission.",
      },
      {
        question: "Can I still change my selected schedule?",
        answer:
          "Yes, but only when the appointment is still pending or when the " +
          "Guidance Office asks you to reschedule. Always check the " +
          "appointment status before making another request.",
      },
      {
        question: "What do the appointment statuses mean?",
        answer:
          "Pending means your request is waiting for review, Approved " +
          "means it has been accepted, Rescheduled means the Guidance Office " +
          "provided a new schedule, Completed means the session is done, " +
          "and Cancelled means it will no longer proceed.",
      },
      {
        question: "What should I do once my appointment schedule is approved?",
        answer:
          "Once your appointment schedule is approved, you must physically " +
          "visit the Guidance Office at your confirmed time slot.",
      },
    ],
  },
  {
    id: "slips",
    title: "Admission Slips",
    description: "Submission guidance for excuse or admission slip requests.",
    icon: FileText,
    questions: [
      {
        question: "How do I submit an admission slip?",
        answer:
          "Open Admission Slips, click Submit Admission Slip, complete " +
          "the required details, upload the needed attachment if applicable, " +
          "then submit your request for review.",
      },
      {
        question: "What is an admission slip used for?",
        answer:
          "An admission slip serves as an official excuse slip for your " +
          "absences, verified and approved by the Guidance Office.",
      },
      {
        question: "Can students revise a submitted admission slip?",
        answer:
          "Yes, students have the privilege to revise their submitted " +
          "admission slips if the counselor marks it as For Revision.",
      },
      {
        question: "What should I check before submitting?",
        answer:
          "Make sure your reason, dates, class details, and uploaded " +
          "documents are correct. Clear and complete information helps the " +
          "Guidance Office review the request faster.",
      },
      {
        question: "How will I know if my slip was approved?",
        answer:
          "Check the status from your Admission Slips page. The system " +
          "will show whether the request is pending, approved, rejected, " +
          "or needs further action.",
      },
    ],
  },
  {
    id: "iir",
    title: "IIR Profile",
    description: "Individual Inventory Record completion and profile updates.",
    icon: ClipboardList,
    questions: [
      {
        question: "Why do I need to complete my IIR first?",
        answer:
          "The IIR helps the Guidance Office understand your academic, " +
          "personal, family, and health background. Some student services " +
          "are restricted until the required IIR information is completed.",
      },
      {
        question: "Can I update my IIR after submitting it?",
        answer:
          "Yes. Go to My IIR Profile and choose the available edit or " +
          "update option. Keep your information accurate, especially if " +
          "there are changes in your contact, family, or academic details.",
      },
      {
        question: "What should I do if my IIR information is incomplete?",
        answer:
          "Open the IIR form again and review each section carefully. " +
          "Complete the missing required fields before accessing other " +
          "student services.",
      },
    ],
  },
];

export default function FAQ() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const totalQuestions = useMemo(
    () =>
      FAQ_CATEGORIES.reduce((sum, category) => {
        return sum + category.questions.length;
      }, 0),
    [],
  );

  const pageMeta = useMemo(
    () => ({
      title: "Student FAQs",
      description:
        "Quick answers for appointments, admission slips, and IIR concerns.",
      badgeText: "Help Center",
      badgeIcon: <HelpCircle className="h-4 w-4" />,
      showDate: false,
    }),
    [],
  );

  usePageMetadata(pageMeta);

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return FAQ_CATEGORIES.map((cat) => {
      if (selectedCategory !== "all" && cat.id !== selectedCategory) {
        return null;
      }

      if (!query) {
        return cat;
      }

      const matchedQuestions = cat.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.answer.toLowerCase().includes(query) ||
          cat.title.toLowerCase().includes(query),
      );

      if (matchedQuestions.length === 0) {
        return null;
      }

      return {
        ...cat,
        questions: matchedQuestions,
      };
    }).filter((cat): cat is FAQCategory => cat !== null);
  }, [searchQuery, selectedCategory]);

  const totalFilteredQuestions = useMemo(() => {
    return filteredCategories.reduce(
      (sum, cat) => sum + cat.questions.length,
      0,
    );
  }, [filteredCategories]);

  return (
    <div
      className={cn(
        "relative isolate mx-auto flex w-full max-w-5xl flex-col",
        "space-y-6 px-4 pb-12 sm:px-6 md:px-8",
      )}
    >
      <AnimationStyles />

      {/* Search Input Bar */}
      <div className="relative w-full">
        <Search
          className={cn(
            "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4",
            "-translate-y-1/2 text-muted-foreground",
          )}
        />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions, topics, or keywords..."
          className="h-11 rounded-xl pl-10 pr-10 text-sm"
        />
        {searchQuery ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSearchQuery("")}
            className={cn(
              "absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2",
              "rounded-lg text-muted-foreground hover:text-foreground",
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {/* Segmented Category Filter Pills */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 border-b",
          "border-border/60 pb-3",
        )}
      >
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs",
            "select-none font-semibold transition-all",
            selectedCategory === "all"
              ? "border border-primary/40 bg-primary/10 text-primary shadow-sm"
              : "border border-border/70 bg-card text-muted-foreground " +
                  "hover:bg-muted/60 hover:text-foreground",
          )}
        >
          <span>All Topics</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px]",
              selectedCategory === "all"
                ? "bg-primary/20 font-bold text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {totalQuestions}
          </span>
        </button>

        {FAQ_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs",
                "select-none font-semibold transition-all",
                isSelected
                  ? "border border-primary/40 bg-primary/10 " +
                      "text-primary shadow-sm"
                  : "border border-border/70 bg-card text-muted-foreground " +
                      "hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span>{cat.title}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  isSelected
                    ? "bg-primary/20 font-bold text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {cat.questions.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Result Feedback Indicator */}
      {searchQuery ? (
        <div className="flex items-center justify-between text-xs">
          <p className="text-muted-foreground">
            Found{" "}
            <span className="font-semibold text-foreground">
              {totalFilteredQuestions}
            </span>{" "}
            question{totalFilteredQuestions === 1 ? "" : "s"} matching &quot;
            <span className="font-semibold text-primary">{searchQuery}</span>
            &quot;
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="h-auto p-0 text-xs text-muted-foreground underline"
          >
            Clear search
          </Button>
        </div>
      ) : null}

      {/* Empty State */}
      {filteredCategories.length === 0 ? (
        <div
          className={cn(
            "rounded-2xl border border-border/80 bg-card p-12",
            "text-center shadow-sm",
          )}
        >
          <div
            className={cn(
              "mx-auto flex h-14 w-14 items-center justify-center",
              "rounded-2xl border border-border bg-muted/40",
              "text-muted-foreground",
            )}
          >
            <SearchX className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            No answers found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We couldn&apos;t find any questions matching &quot;{searchQuery}
            &quot;.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-5 h-9 rounded-xl font-semibold"
          >
            Clear search and filters
          </Button>
        </div>
      ) : (
        /* FAQ Categories and Accordions */
        <div className="space-y-6">
          {filteredCategories.map((category) => {
            const Icon = category.icon;

            return (
              <Card
                key={category.id}
                className={cn(
                  "rounded-2xl border border-border/80 bg-card shadow-sm",
                )}
              >
                <CardHeader
                  className={cn("border-b border-border/60 bg-muted/10 p-5")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center",
                          "justify-center rounded-xl border",
                          "border-primary/20 bg-primary/5 text-primary",
                          "shadow-sm",
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          {category.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-border/80 bg-muted/40 text-xs font-semibold",
                      )}
                    >
                      {category.questions.length} questions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion
                    type="multiple"
                    className="w-full"
                  >
                    {category.questions.map((q, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${category.id}-${idx}`}
                        className={cn(
                          "border-b border-border/60 px-5 last:border-b-0",
                        )}
                      >
                        <AccordionTrigger
                          className={cn(
                            "py-4 text-left text-sm font-semibold",
                            "text-foreground hover:no-underline",
                          )}
                        >
                          <span>{q.question}</span>
                        </AccordionTrigger>
                        <AccordionContent
                          className={cn(
                            "text-sm leading-relaxed text-muted-foreground",
                          )}
                        >
                          {q.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Guidance Office Contact / Helpdesk CTA */}
      <Card
        className={cn(
          "rounded-2xl border border-primary/20 bg-primary/[0.03]",
          "p-6 shadow-sm",
        )}
      >
        <div
          className={cn(
            "flex flex-col items-start justify-between gap-5 sm:flex-row",
            "sm:items-center",
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center",
                "rounded-2xl border border-primary/25 bg-primary/10",
                "text-primary shadow-sm",
              )}
            >
              <LifeBuoy className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                Still have questions?
              </h4>
              <p
                className={cn(
                  "mt-1 text-xs leading-relaxed text-muted-foreground",
                  "sm:max-w-md",
                )}
              >
                If your question isn&apos;t answered here, feel free to visit
                the Guidance Office or schedule an in-person consultation.
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto",
            )}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/student/slips")}
              className="h-9 rounded-xl font-semibold sm:w-auto"
            >
              Go to Slips
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/student/appointments")}
              className="h-9 rounded-xl font-semibold shadow-sm sm:w-auto"
            >
              Book Consultation
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
