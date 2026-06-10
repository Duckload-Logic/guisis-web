import Layout from "@/components/layout/Layout";
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
  const cardStyle = cn(
    "rounded-xl border p-6 shadow-md shadow-neutral-200/30",
    "transition duration-300 hover:-translate-y-1 hover:border-amber-500/40",
    "dark:border-neutral-800 dark:bg-neutral-900/90 dark:shadow-black/20",
  );
  const cardColors = cn(
    "bg-white/95 border-neutral-200 text-neutral-950",
    "dark:bg-neutral-900/85 dark:border-neutral-800 dark:text-white",
  );

  const featureCards = [
    {
      title: "Appointments",
      icon: Calendar,
      description:
        "Schedule and manage counseling sessions with ease using the " +
        "integrated guidance online services system.",
      style: cardColors,
    },
    {
      title: "Admission Slips",
      icon: FileText,
      description:
        "Submit excuse letters and official documents to acquire " +
        "admission slips",
      style: cardColors,
    },
    {
      title: "Secure IDP Access",
      icon: Lock,
      description:
        "Login safely through the university identity provider for " +
        "trusted access to student services.",
      style: cardColors,
    },
    {
      title: "Guidance Support",
      icon: MessageSquare,
      description:
        "Access help and guidance resources from the PUP guidance office " +
        "whenever you need assistance.",
      style: cardColors,
    },
  ];

  const contactCards = [
    {
      title: "Support",
      icon: LifeBuoy,
      description:
        "Need help with IDP login or guidance services? Our team is " +
        "ready to assist you.",
      style: cardColors,
    },
    {
      title: "Email",
      icon: Mail,
      description: "Tech Support: duckload7116@gmail.com",
      style: cardColors,
    },
    {
      title: "Campus Office",
      icon: MapPin,
      description: "Polytechnic University of the Philippines – Taguig",
      style: cardColors,
    },
  ];

  const faqs = [
    {
      q: "How do I log in to GuiSIS?",
      a:
        "You must use your official university credentials via the integrated " +
        "Identity Provider (IDP) login option.",
    },
    {
      q: "Can I request guidance support off-campus?",
      a:
        "Yes, the GuiSIS portal allows you to book " +
        "appointments directly online.",
    },
  ];

  return (
    <Layout
      isLoggedIn={false}
      showHeader={true}
    >
      <div
        id="top"
        className="space-y-20"
      >
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white text-slate-900 dark:bg-black dark:text-white">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-[15%] top-10 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="absolute right-[10%] top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-8 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
                PUP Taguig Portal
              </div>
              <div className="space-y-6">
                <p className="text-sm uppercase tracking-[0.35em] text-amber-600 dark:text-amber-300/90">
                  Guidance & Advising System
                </p>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
                  Your guidance journey starts with a secure, modern platform.
                </h1>
                <p className="text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                  Access counseling, appointments, academic guidance, and " +
                  "support services through the PUP Guidance Services " +
                  "Information System.
                </p>
              </div>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  to="/login"
                  className={cn(
                    "inline-flex h-14 items-center justify-center gap-2",
                    "rounded-full bg-amber-400 px-8 text-lg font-semibold",
                    "text-slate-950 shadow-xl shadow-amber-400/20",
                    "transition-all duration-300 hover:bg-amber-500",
                    "hover:-translate-y-0.5 active:scale-[0.98]",
                  )}
                >
                  Proceed to Login
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#features"
                  className={cn(
                    "inline-flex h-14 items-center justify-center rounded-full",
                    "border border-slate-300 bg-slate-100 px-8 text-sm",
                    "font-semibold text-slate-900 transition hover:border-slate-400",
                    "hover:bg-slate-200 dark:border-white/15 dark:bg-white/5",
                    "dark:text-white dark:hover:border-white/30",
                    "dark:hover:bg-white/10",
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
          className="scroll-mt-24 bg-slate-100 text-slate-900 dark:bg-black dark:text-slate-100"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
                What we offer
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                A modern guidance online services system built for support.
              </h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-amber-400/80" />
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8">
              {featureCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={cn(
                      cardStyle,
                      item.style,
                      "flex w-full max-w-[380px] flex-col gap-4",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-amber-500" />
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
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
          className="scroll-mt-24 bg-white text-slate-900 dark:bg-black dark:text-slate-100"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid items-start gap-10 lg:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
                  Why GuiSIS
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                  More than login — a safer gateway for guidance and support.
                </h2>
                <p className="mt-6 text-base leading-8 text-slate-600 dark:text-slate-300">
                  Built for the Polytechnic University of the Philippines
                  Taguig, GuiSIS is designed to support students with secure
                  access to academic guidance, counseling services, and official
                  resources.
                </p>
              </div>

              <div className="space-y-4 rounded-[30px] border border-neutral-200/80 bg-white/50 p-8 shadow-xl backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/50">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">
                    Secure by default
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Only authenticated students and staff can access the system,
                    with all sessions routed through the university IDP.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-950 dark:text-white">
                    Easy navigation
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
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
          className="scroll-mt-24 bg-slate-100 text-slate-900 dark:bg-black dark:text-slate-100"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
                FAQ
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently Asked Questions
              </h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-amber-400/80" />
            </div>

            <div className="mx-auto mt-12 max-w-3xl space-y-6">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="dark:border-neutral-850 rounded-[20px] border border-neutral-200 bg-white p-6 dark:bg-neutral-900/80"
                >
                  <div className="flex items-start gap-3">
                    <HelpCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        {faq.q}
                      </h4>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
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
          className="scroll-mt-24 bg-slate-50 text-slate-900 dark:bg-black dark:text-slate-100"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
                Get in touch
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Contact us for support and access help.
              </h2>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-8">
              {contactCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className={cn(
                      cardStyle,
                      item.style,
                      "flex w-full max-w-[380px] flex-col gap-4",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-6 w-6 text-amber-500" />
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-base leading-7 text-slate-600 dark:text-slate-300">
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
