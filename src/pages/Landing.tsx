import Layout from "@/components/layout/Layout";
import { API_ROUTES } from "@/config/apiRoutes";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  LogIn,
  Clock,
  MapPin,
  Mail,
  AlertCircle,
  FileCheck2,
  CalendarCheck,
  ClipboardList,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

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

  const faqs = [
    {
      q: "How do I sign in?",
      a: "Use your registered institutional webmail credentials via the university Identity Provider (IDP).",
    },
    {
      q: "Who can access counseling records?",
      a: "Only authorized Guidance Counselors have permission to view counseling case notes and session records.",
    },
    {
      q: "How long does admission slip verification take?",
      a: "Submitted slips are verified during regular office hours (Monday to Friday, 8:00 AM – 5:00 PM).",
    },
  ];

  return (
    <Layout isLoggedIn={false} showHeader={true}>
      <div id="top" className="space-y-16 pb-16">
        {/* Main Portal Hero */}
        <main className="min-h-[calc(100vh-8rem)] flex flex-col justify-center px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Institutional Information & Operational Advisories */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Guidance and Counseling Office
                </p>
                <h1 className="mt-1.5 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                  Guidance Services Information System
                </h1>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                  Official online service portal for student individual inventory records,
                  counseling appointment requests, and admission slip processing.
                </p>
              </div>

              {/* Operational Bulletin Board */}
              <div id="about" className="scroll-mt-24 rounded-lg border border-border bg-card p-5 space-y-4 shadow-sm">
                <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Service Reminders & Operational Policies
                </h2>

                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <ClipboardList className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground font-medium">Individual Inventory Record (IIR):</strong>{" "}
                      Enrolled students must complete and maintain an updated digital profile each academic term.
                    </span>
                  </li>

                  <li className="flex items-start gap-3">
                    <CalendarCheck className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground font-medium">Counseling Appointments:</strong>{" "}
                      Appointments are scheduled based on counselor availability and prioritized according to case urgency.
                    </span>
                  </li>

                  <li className="flex items-start gap-3">
                    <FileCheck2 className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-foreground font-medium">Admission & Excuse Slips:</strong>{" "}
                      Upload your valid Certificate of Registration (COR) and official absence documentation for verification.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Office Contact Info Strip */}
              <div id="contact" className="scroll-mt-24 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-muted-foreground border-t border-border">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>Mon – Fri, 8:00 AM – 5:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>Guidance Office, Ground Floor</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span>supportguisis@gmail.com</span>
                </div>
              </div>
            </div>

            {/* Right Column: Authentication Card */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
                <div className="space-y-1 text-center sm:text-left">
                  <h2 className="text-xl font-semibold text-foreground tracking-tight">
                    Portal Authentication
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Sign in using your institutional webmail account to access services.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    size="lg"
                    className="w-full gap-2.5 font-medium h-11 text-sm"
                    onClick={handleLogin}
                  >
                    <LogIn className="h-4 w-4" />
                    Continue with University IDP
                  </Button>
                </div>

                <div className="rounded border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground leading-normal">
                  <p>
                    <strong>Access Policy:</strong> This portal processes confidential guidance and academic records.
                    Access is restricted to authorized university personnel and currently enrolled students in accordance with RA 10173.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* What We Offer / Features Section (Targets #features) */}
        <section id="features" className="scroll-mt-24 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border pt-12">
            <div className="mb-8">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Available Guidance Services</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Core student assistance modules accessible via the web portal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-lg border border-border bg-card p-5 space-y-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Individual Inventory Profiling</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Digital profiling form capturing academic, family, and demographic background with automated COR extraction.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5 space-y-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Counseling Appointment Triage</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Confidential consultation scheduling with automated priority categorization for high-risk concerns.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-card p-5 space-y-2">
                <FileCheck2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Admission Slip Requests</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Asynchronous absence documentation filing, counselor validation, and digital slip generation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section (Targets #faq) */}
        <section id="faq" className="scroll-mt-24 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border pt-12">
            <div className="mb-6">
              <h2 className="text-xl font-bold tracking-tight text-foreground">Frequently Asked Questions</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Reference guidelines for portal usage and record management.
              </p>
            </div>

            <div className="space-y-3 max-w-3xl">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-1.5">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                    {faq.q}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
