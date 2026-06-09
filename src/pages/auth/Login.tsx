import { useState } from "react";
import { AuthHeader } from "@/features/auth/components";
import Layout from "@/components/layout/Layout";
import { cn } from "@/lib/utils";
import { Calendar, Lock, MessageSquare, LifeBuoy, Mail, MapPin } from "lucide-react";
import { IDPLoginButton } from "@/features/auth/components/IDPLoginButton";

export default function Login() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const cardStyle = "rounded-[24px] border p-5 shadow-xl shadow-neutral-200/30 transition hover:-translate-y-1 hover:border-amber-500/40 dark:border-neutral-800 dark:bg-neutral-900/90 dark:shadow-black/20";
  const cardColors = "bg-white/95 border-neutral-200 text-neutral-950 dark:bg-neutral-900/85 dark:border-neutral-800 dark:text-white";

  const featureCards = [
    {
      title: "Appointments",
      icon: Calendar,
      description: "Schedule and manage counseling sessions with ease using the integrated guidance online services system.",
      style: cardColors,
    },
    {
      title: "Secure IDP Access",
      icon: Lock,
      description: "Login safely through the university identity provider for trusted access to student services.",
      style: cardColors,
    },
    {
      title: "Guidance Support",
      icon: MessageSquare,
      description: "Access help and guidance resources from the PUP guidance office whenever you need assistance.",
      style: cardColors,
    },
  ];

  const contactCards = [
    {
      title: "Support",
      icon: LifeBuoy,
      description: "Need help with IDP login or guidance services? Our team is ready to assist you.",
      style: cardColors,
    },
    {
      title: "Email",
      icon: Mail,
      description: "duckload7116@gmail.com",
      style: cardColors,
    },
    {
      title: "Campus Office",
      icon: MapPin,
      description: "Polytechnic University of the Philippines – Taguig",
      style: cardColors,
    },
  ];

  return (
    <Layout isLoggedIn={false} isLoading={isLoggingIn}>
      <div id="top" className="space-y-16">
        <section className="relative overflow-hidden bg-white text-slate-900 dark:bg-black dark:text-white">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[15%] top-10 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />
          
          <div className="absolute right-[10%] top-20 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl" />
          
          <div className="absolute left-1/2 top-32 h-72 w-72 -translate-x-1/2 rounded-full bg-red-700/10 blur-3xl" />
        </div>
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
                  Guidance Services Information System
                </div>
                <div className="space-y-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-amber-600 dark:text-amber-300/90">Guidance & advising</p>
                  <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
                    Your guidance journey starts with a secure, modern online services system.
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">
                    Access counseling, appointments, academic guidance, and support services through the PUP Guidance Services Information System.
                  </p>
                  <p className="max-w-lg text-base leading-7 text-slate-500 dark:text-slate-400">
                    Trusted by PUP students and advisors to make guidance services faster, safer, and easier.
                  </p>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <IDPLoginButton
                    disabled={isLoggingIn}
                    className={cn(
                      "inline-flex h-14 items-center justify-center rounded-full bg-amber-400 px-8 text-lg font-semibold text-slate-950",
                      "shadow-xl shadow-black/30 transition-all duration-300 hover:bg-amber-500 hover:-translate-y-0.5 active:scale-[0.98]",
                      isLoggingIn ? "animate-pulse cursor-wait opacity-80" : ""
                    )}
                  />
                  <a href="#features" className="inline-flex h-14 items-center justify-center rounded-full border border-slate-300 bg-slate-100 px-8 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-200 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-white/30 dark:hover:bg-white/10">
                    Learn more
                  </a>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-white/5 dark:text-slate-200">Secure IDP login</span>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-white/5 dark:text-slate-200">Student-centered support</span>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-white/5 dark:text-slate-200">Easy appointment booking</span>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[30px] border border-neutral-200/70 bg-white/95 p-6 shadow-2xl shadow-neutral-900/10 dark:border-white/10 dark:bg-neutral-950/95 dark:shadow-black/40 dark:backdrop-blur-lg lg:self-start lg:max-w-[440px] lg:mx-0 mx-auto">
                <AuthHeader
                  title="Guidance Services Information System"
                  subtitle="Secure access to guidance services, support, and account tools."
                />
                <div className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                  <p>Login with your university IDP to continue.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 bg-slate-100 text-slate-900 dark:bg-black dark:text-slate-100">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-500">What we offer</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                A modern guidance online services system built for support.
              </h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-amber-400/80" />
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                GuiSIS brings your counseling appointments, academic guidance, and guidance resources into one secure, easy-to-use guidance online services system.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-3 items-start">
              {featureCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className={`${cardStyle} ${item.style} flex flex-col gap-5 items-start`}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-amber-500" />
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                      </div>
                      <p className="text-base leading-7 text-slate-600 dark:text-slate-300">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24 bg-white text-slate-900 dark:bg-black dark:text-slate-100">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_0.8fr] lg:items-start">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Why GuiSIS</p>
                <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                  More than login — a safer gateway for guidance and support.
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                  Built for the Polytechnic University of the Philippines Taguig, GuiSIS is designed to support students with secure access to academic guidance, counseling services, and official campus resources.
                </p>
              </div>
              <div className="space-y-4 rounded-[30px] border border-neutral-200/80 bg-white/50 p-8 shadow-xl shadow-neutral-200/40 dark:border-neutral-800 dark:bg-neutral-900/50 backdrop-blur-sm">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">Secure by default</h3>
                  <p className="mt-3 text-neutral-600 dark:text-neutral-400">Only authenticated students and staff can access the system, with all sessions routed through the university IDP.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">Easy navigation</h3>
                  <p className="mt-3 text-neutral-600 dark:text-neutral-400">A clean, modern interface gives you fast access to guidance resources, appointments, and support contacts.</p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">Designed for students</h3>
                  <p className="mt-3 text-neutral-600 dark:text-neutral-400">Everything in the system is created around student needs, support services, and seamless access to counseling tools.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 bg-slate-50 text-slate-900 dark:bg-black dark:text-slate-100">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Get in touch</p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Contact us for support and access help.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
                Have a question about login, appointments, or guidance services? Reach out to our campus guidance team.
              </p>
            </div>

            <div className="mt-12 grid gap-8 lg:grid-cols-3 items-start">
              {contactCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className={`${cardStyle} ${item.style} flex flex-col gap-4 items-start`}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-amber-500" />
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                      </div>
                      <p className={`text-base leading-7 ${item.title === "Email" ? "text-slate-700 text-lg" : "text-slate-600"} dark:text-slate-300`}>
                        {item.description}
                      </p>
                    </div>
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
