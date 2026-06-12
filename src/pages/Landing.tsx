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
import { Link } from "react-router-dom";

export default function Landing() {
  const isProd = import.meta.env.VITE_IS_PRODUCTION === "true";
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const authorizeUrl = API_ROUTES.auth.idpAuthorizeUrl;
  const loginUrl = isProd ? `${apiBase}${authorizeUrl}` : "/login";

  const cardStyle = cn(
    "rounded-xl border p-6 shadow-md border-border bg-card",
    "text-card-foreground transition-all duration-300",
    "hover:-translate-y-1 hover:border-primary/40",
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
      description: "Tech Support: ducklogic7116@gmail.com",
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
        <section className={cn(
          "relative overflow-hidden rounded-xl border border-glass-border",
          "bg-glass-bg text-foreground shadow-md bg-grid",
        )}>
          {/* Ambient Glows */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className={cn(
              "absolute left-[10%] top-10 h-72 w-72 rounded-full",
              "bg-primary/10 blur-3xl animate-glow",
            )} />
            <div className={cn(
              "absolute right-[10%] bottom-10 h-72 w-72 rounded-full",
              "bg-secondary/10 blur-3xl animate-glow [animation-delay:2s]",
            )} />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <div className={cn(
                "inline-flex items-center gap-2 rounded-full border",
                "border-border bg-background/50 px-4 py-1.5 text-xs",
                "font-semibold uppercase tracking-[0.2em] sm:tracking-[0.35em]",
                "text-muted-foreground shadow-sm backdrop-blur",
              )}>
                PUP-Taguig GuiSIS
              </div>
              <div className="space-y-4">
                <p className={cn(
                  "text-xs sm:text-sm font-bold uppercase tracking-[0.15em]",
                  "sm:tracking-[0.25em] text-secondary",
                )}>
                  Polytechnic University of the Philippines – Taguig
                </p>
                <h1 className={cn(
                  "text-2xl sm:text-4xl lg:text-5xl font-extrabold",
                  "tracking-tight text-foreground leading-tight",
                )}>
                  Your guidance journey starts with a{" "}
                  <span className="text-gradient">secure, modern platform</span>.
                </h1>
                <p className={cn(
                  "text-sm sm:text-base md:text-lg leading-relaxed",
                  "text-muted-foreground max-w-2xl mx-auto",
                )}>
                  Request counseling appointments, admission slips, and guidance
                  services through the PUP Guidance Services Information System.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                {isProd ? (
                  <a
                    href={loginUrl}
                    className={cn(
                      "inline-flex h-12 w-full sm:w-auto items-center",
                      "justify-center gap-2 rounded-lg bg-primary px-8",
                      "text-base font-semibold text-primary-foreground",
                      "shadow-lg shadow-primary/20 transition-all duration-300",
                      "hover:bg-primary-dark hover:-translate-y-0.5",
                      "active:scale-[0.98]",
                    )}
                  >
                    Proceed to Login
                    <ArrowRight className="h-5 w-5" />
                  </a>
                ) : (
                  <Link
                    to={loginUrl}
                    className={cn(
                      "inline-flex h-12 w-full sm:w-auto items-center",
                      "justify-center gap-2 rounded-lg bg-primary px-8",
                      "text-base font-semibold text-primary-foreground",
                      "shadow-lg shadow-primary/20 transition-all duration-300",
                      "hover:bg-primary-dark hover:-translate-y-0.5",
                      "active:scale-[0.98]",
                    )}
                  >
                    Proceed to Login
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                )}
                <a
                  href="#features"
                  className={cn(
                    "inline-flex h-12 w-full sm:w-auto items-center",
                    "justify-center rounded-lg border border-input",
                    "bg-background px-8 text-sm font-semibold",
                    "text-foreground transition hover:bg-accent",
                    "hover:-translate-y-0.5 active:scale-[0.98]",
                  )}
                >
                  Learn more
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="relative overflow-hidden rounded-xl text-foreground"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className={cn(
                "text-xs sm:text-sm font-bold uppercase",
                "tracking-[0.2em] text-secondary",
              )}>
                What we offer
              </p>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">
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
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground mt-2">
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
          className="relative scroll-mt-24 overflow-hidden rounded-xl text-foreground"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div className="space-y-4">
                <p className={cn(
                  "text-xs sm:text-sm font-bold uppercase",
                  "tracking-[0.2em] text-secondary",
                )}>
                  Why GuiSIS
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  More than login — a safer gateway for guidance and support.
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                  Built for the Polytechnic University of the Philippines
                  Taguig, GuiSIS is designed to support students with secure
                  access to academic guidance, counseling services, and official
                  resources.
                </p>
              </div>

              <div className={cn(
                "space-y-6 rounded-2xl border border-border bg-card",
                "p-6 sm:p-8 shadow-md",
              )}>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Secure by default
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Only authenticated students and staff can access the system,
                    with all sessions routed through the university IDP.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Easy navigation
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
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
          className="relative scroll-mt-24 overflow-hidden rounded-xl text-foreground"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className={cn(
                "text-xs sm:text-sm font-bold uppercase",
                "tracking-[0.2em] text-secondary",
              )}>
                FAQ
              </p>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight">
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
                    "shadow-sm transition-all duration-200",
                    "hover:border-primary/20",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="space-y-1">
                      <h4 className={cn(
                        "font-semibold text-foreground",
                        "text-sm sm:text-base",
                      )}>
                        {faq.q}
                      </h4>
                      <p className={cn(
                        "text-xs sm:text-sm text-muted-foreground",
                        "leading-relaxed",
                      )}>
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
            "text-foreground",
          )}
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className={cn(
                "text-xs sm:text-sm font-bold uppercase",
                "tracking-[0.2em] text-secondary",
              )}>
                Get in touch
              </p>
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
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
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground mt-2">
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
