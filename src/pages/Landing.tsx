import Layout from "@/components/layout/Layout";
import { API_ROUTES } from "@/config/apiRoutes";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Lock,
  MessageSquare,
  LifeBuoy,
  Mail,
  MapPin,
  ArrowRight,
  HelpCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const isProd = import.meta.env.VITE_IS_PRODUCTION === "true";
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const authorizeUrl = API_ROUTES.auth.idpAuthorizeUrl;
  const loginUrl = isProd ? `${apiBase}${authorizeUrl}` : "/login";

  const navigate = useNavigate();

  const cardStyle = cn(
    "rounded-xl border p-6 shadow-md border-border bg-card",
    "text-card-foreground transition-all duration-300",
    "hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/40",
  );

  const featureCards = [
    {
      title: "Appointments",
      icon: Calendar,
      description:
        "Schedule and manage counseling sessions with ease using the " +
        "integrated guidance online services system.",
    },
    {
      title: "Admission Slips",
      icon: FileText,
      description:
        "Submit excuse letters and official documents to acquire " +
        "admission slips",
    },
    {
      title: "Secure IDP Access",
      icon: Lock,
      description:
        "Login safely through the university identity provider for " +
        "trusted access to student services.",
    },
    {
      title: "Guidance Support",
      icon: MessageSquare,
      description:
        "Access help and guidance resources from the PUPT guidance office " +
        "whenever you need assistance.",
    },
  ];

  const contactCards = [
    {
      title: "Support",
      icon: LifeBuoy,
      description:
        "Need help with IDP login or guidance services? Our team is " +
        "ready to assist you.",
    },
    {
      title: "Email",
      icon: Mail,
      description:
        "Guidance Office: \n" + "Tech Support: supportguisis@gmail.com",
    },
    {
      title: "Campus Office",
      icon: MapPin,
      description: "Polytechnic University of the Philippines – Taguig",
    },
  ];

  const faqs = [
    {
      q: "How do I log in to GuiSIS?",
      a:
        "You must use your official university credentials via the " +
        "integrated Identity Provider (IDP) login option.",
    },
    {
      q: "Can I request guidance support off-campus?",
      a:
        "Yes, the GuiSIS portal allows you to book " +
        "appointments and request admission slips directly online.",
    },
    {
      q: "How do I create an account?",
      a:
        "You must use your official university credentials via the " +
        "integrated Identity Provider (IDP) login option.",
    },
  ];

  return (
    <Layout
      isLoggedIn={false}
      showHeader={true}
    >
      <div
        id="top"
        className="space-y-10"
      >
        {/* Hero Section */}
        <section
          className={cn(
            "relative overflow-hidden rounded-xl border border-glass-border",
            "bg-glass-bg text-foreground shadow-md bg-grid",
            "min-h-[calc(100vh-13rem)] flex flex-col justify-center",
          )}
        >
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div
              className={cn(
                "absolute left-[10%] top-10 h-72 w-72 rounded-full",
                "animate-glow bg-primary/40 blur-3xl dark:bg-primary/30",
              )}
            />
            <div
              className={cn(
                "absolute bottom-10 right-[10%] h-72 w-72 rounded-full",
                "animate-glow bg-secondary/40 blur-3xl [animation-delay:2s] dark:bg-secondary/30",
              )}
            />
          </div>

          <div
            className={cn(
              "relative mx-auto max-w-6xl px-4 py-8",
              "sm:py-12 lg:py-16",
            )}
          >
            <div className="mx-auto max-w-2xl space-y-6 text-center">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border",
                  "border-border bg-background/50 px-4 py-1.5 text-xs",
                  "font-semibold uppercase tracking-[0.2em] sm:tracking-[0.35em]",
                  "text-muted-foreground shadow-sm backdrop-blur",
                  "animate-fade-in-down",
                )}
              >
                PUP-Taguig GuiSIS
              </div>
              <div className="space-y-4">
                <p
                  className={cn(
                    "text-xs font-bold uppercase tracking-[0.15em] sm:text-sm",
                    "text-secondary sm:tracking-[0.25em] animate-fade-in-up",
                  )}
                  style={{ animationDelay: "150ms", animationFillMode: "both" }}
                >
                  Polytechnic University of the Philippines – Taguig
                </p>
                <h1
                  className={cn(
                    "text-2xl font-extrabold sm:text-4xl lg:text-5xl",
                    "leading-tight tracking-tight text-foreground",
                    "animate-fade-in-up",
                  )}
                  style={{ animationDelay: "300ms", animationFillMode: "both" }}
                >
                  Your guidance journey starts with a{" "}
                  <span className="text-gradient">secure, modern platform</span>
                  .
                </h1>
                <p
                  className={cn(
                    "text-sm leading-relaxed sm:text-base md:text-lg",
                    "mx-auto max-w-xl text-muted-foreground",
                    "animate-fade-in-up",
                  )}
                  style={{ animationDelay: "450ms", animationFillMode: "both" }}
                >
                  Request counseling appointments, admission slips, and guidance
                  services through the PUP Guidance Services Information System.
                </p>
              </div>

              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-4",
                  "sm:flex-row animate-fade-in-up",
                )}
                style={{ animationDelay: "600ms", animationFillMode: "both" }}
              >
                {isProd ? (
                  <Button onClick={() => window.open(loginUrl, "_self")}>
                    Proceed to Login
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button onClick={() => navigate(loginUrl)}>
                    Proceed to Login
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                )}
                <Button
                  onClick={() =>
                    document.getElementById("features")?.scrollIntoView()
                  }
                  variant="outline"
                >
                  Learn more
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className={cn(
            "relative overflow-hidden text-foreground",
            "min-h-[calc(100vh-13rem)] flex flex-col justify-center",
          )}
        >
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-8",
              "sm:px-6 lg:px-8",
            )}
          >
            <div className="mx-auto max-w-2xl text-center">
              <p
                className={cn(
                  "text-xs font-bold uppercase sm:text-sm",
                  "tracking-[0.2em] text-secondary",
                )}
              >
                What we offer
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                A modern guidance online services system built for support.
              </h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-secondary/80" />
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featureCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={cardStyle}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className={cn(
            "relative scroll-mt-24 overflow-hidden rounded-xl",
            "border border-glass-border bg-glass-bg bg-grid shadow-md",
            "text-foreground min-h-[calc(100vh-13rem)] flex flex-col",
            "justify-center",
          )}
        >
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-8",
              "sm:px-6 lg:px-8",
            )}
          >
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="space-y-4 max-w-lg">
                <p
                  className={cn(
                    "text-xs font-bold uppercase sm:text-sm",
                    "tracking-[0.2em] text-secondary",
                  )}
                >
                  Why GuiSIS
                </p>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  More than login — a safer gateway for guidance and support.
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Built for the Polytechnic University of the Philippines
                  Taguig, GuiSIS is designed to support students with secure
                  access to academic guidance, counseling services, and official
                  resources.
                </p>
              </div>

              <div
                className={cn(
                  "space-y-6 rounded-2xl border border-border bg-card",
                  "p-6 shadow-md sm:p-8 max-w-lg lg:ml-auto w-full",
                  "transition-all duration-300 hover:-translate-y-1",
                  "hover:scale-[1.02] hover:border-primary/40",
                )}
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Secure by default
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Only authenticated students and staff can access the system,
                    with all sessions routed through the university IDP.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Easy navigation
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    A clean, modern interface gives you fast access to guidance
                    resources, appointments, and support contacts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section
          id="faq"
          className={cn(
            "relative scroll-mt-24 overflow-hidden text-foreground",
            "min-h-[calc(100vh-13rem)] flex flex-col justify-center",
          )}
        >
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-8",
              "sm:px-6 lg:px-8",
            )}
          >
            <div className="mx-auto max-w-2xl text-center">
              <p
                className={cn(
                  "text-xs font-bold uppercase sm:text-sm",
                  "tracking-[0.2em] text-secondary",
                )}
              >
                FAQ
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Frequently Asked Questions
              </h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-secondary/80" />
            </div>

            <div className="mx-auto mt-12 max-w-3xl space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={cn(
                    "rounded-xl border border-border bg-card p-5 sm:p-6",
                    "shadow-sm transition-all duration-300",
                    "hover:scale-[1.01] hover:border-primary/30 hover:shadow-md",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <h4
                        className={cn(
                          "font-semibold text-foreground",
                          "text-sm sm:text-base",
                        )}
                      >
                        {faq.q}
                      </h4>
                      <p
                        className={cn(
                          "text-xs text-muted-foreground sm:text-sm",
                          "leading-relaxed",
                        )}
                      >
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section
          id="contact"
          className={cn(
            "relative scroll-mt-24 overflow-hidden rounded-xl",
            "border border-glass-border bg-glass-bg bg-grid shadow-md",
            "text-foreground min-h-[calc(100vh-13rem)] flex flex-col",
            "justify-center",
          )}
        >
          <div
            className={cn(
              "mx-auto max-w-6xl px-4 py-8",
              "sm:px-6 lg:px-8",
            )}
          >
            <div className="mx-auto max-w-2xl text-center">
              <p
                className={cn(
                  "text-xs font-bold uppercase sm:text-sm",
                  "tracking-[0.2em] text-secondary",
                )}
              >
                Get in touch
              </p>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Contact us for support and access help.
              </h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-secondary/80" />
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {contactCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={cardStyle}
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                    </div>
                    <p
                      className={cn(
                        "mt-2 text-sm leading-relaxed",
                        "whitespace-pre-line text-muted-foreground",
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
