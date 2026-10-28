import Layout from "@/components/layout/Layout";
import { API_ROUTES } from "@/config/apiRoutes";
import {
  Calendar,
  LifeBuoy,
  Mail,
  MapPin,
  ArrowRight,
  HelpCircle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  const isProd = import.meta.env.VITE_IS_PRODUCTION === "true";
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const authorizeUrl = API_ROUTES.auth.idpAuthorizeUrl;
  const loginUrl = isProd ? `${apiBase}${authorizeUrl}` : "/login";

  const navigate = useNavigate();

  const handleLogin = () => {
    if (isProd) {
      window.location.assign(loginUrl);
    } else {
      navigate(loginUrl);
    }
  };

  const services = [
    {
      icon: Calendar,
      title: "Counseling & Triage",
      desc:
        "Confidential appointment requests with automated urgency " +
        "prioritization for prompt counselor intervention.",
    },
    {
      icon: FileText,
      title: "Admission & Excuse Slips",
      desc:
        "Digital submission of absence excuses and instant issuance of " +
        "tamper-verified admission slip tickets.",
    },
    {
      icon: ShieldCheck,
      title: "Individual Inventory Record",
      desc:
        "Centralized, RA 10173-compliant student profiling with automated " +
        "Certificate of Registration (COR) extraction.",
    },
  ];

  const faqs = [
    {
      q: "How do I log in to GuiSIS?",
      a:
        "Authenticate using your official PUP Webmail credentials via the " +
        "university Identity Provider (IDP).",
    },
    {
      q: "Who can see my counseling notes and submitted forms?",
      a:
        "Your records are protected by strict Role-Based Access Control " +
        "(RBAC). Only the designated Guidance Counselor can access " +
        "counseling case histories.",
    },
    {
      q: "Can I request admission slips remotely?",
      a:
        "Yes. Upload your supporting documents (medical certificate, excuse " +
        "letter) directly through the portal for async counselor review.",
    },
  ];

  return (
    <Layout isLoggedIn={false} showHeader={true}>
      <div id="top" className="relative space-y-16 pb-16">
        {/* Subtle Institutional Grid */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid opacity-30" />

        {/* Hero Section */}
        <section className="relative mx-auto max-w-5xl pt-12 sm:pt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            {/* Status Pill */}
            <div
              className={
                "mb-6 inline-flex items-center gap-2 rounded-full border " +
                "border-border bg-card px-3.5 py-1 text-xs font-medium " +
                "text-foreground shadow-sm"
              }
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PUP-Taguig Guidance & Counseling Services Portal</span>
            </div>

            {/* Main Headline */}
            <h1
              className={
                "text-4xl font-extrabold tracking-tight text-foreground " +
                "sm:text-6xl max-w-3xl leading-[1.15]"
              }
            >
              Campus Guidance Services, <br />
              <span className="text-primary">Streamlined & Secure.</span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              The official centralized platform for Polytechnic University of the
              Philippines – Taguig students. Manage your Individual Inventory
              Record (IIR), request admission slips, and schedule counseling sessions.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 text-base font-semibold px-8 h-12 shadow-sm"
                onClick={handleLogin}
              >
                Sign In with University IDP <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base font-medium h-12"
                onClick={() =>
                  document.getElementById("services")?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                View Services
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> RA 10173 Data Privacy Compliant
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Single Sign-On Enabled
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" /> Mon – Fri, 8:00 AM – 5:00 PM
              </span>
            </div>
          </motion.div>
        </section>

        {/* Core Services Section */}
        <section id="services" className="scroll-mt-20 mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Core Guidance Services</h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Digitized workflows engineered to eliminate physical office bottlenecks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card p-6 shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Support & FAQ */}
        <section id="support" className="scroll-mt-20 mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Common inquiries regarding access, appointments, and data protection.
              </p>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex gap-3">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{faq.q}</h4>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Card (1/3 width) */}
          <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between space-y-6">
            <div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Need Assistance?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Guidance Office personnel are available during operational hours.
              </p>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Guidance Office</p>
                    <p className="text-xs text-muted-foreground">
                      PUP Taguig Campus, Gen. Santos Ave, Bicutan
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Technical Support</p>
                    <p className="text-xs text-muted-foreground">supportguisis@gmail.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Office Schedule</p>
                    <p className="text-xs text-muted-foreground">
                      Monday – Friday: 8:00 AM – 5:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full text-sm font-medium"
              onClick={() => {
                window.location.href = "mailto:supportguisis@gmail.com";
              }}
            >
              Contact Support
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
