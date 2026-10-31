import Layout from "@/components/layout/Layout";
import { API_ROUTES } from "@/config/apiRoutes";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  FileText,
  Clock,
  MapPin,
  Mail,
  PhoneCall,
  Shield,
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
      q: "Who has access to my counseling records?",
      a:
        "All consultation notes and psychological assessments are strictly " +
        "confidential. Access is restricted exclusively to authorized guidance " +
        "counselors under Republic Act No. 10173 (Data Privacy Act of 2012). " +
        "Faculty, department heads, and peers cannot view your records.",
    },
    {
      q: "How does the admission slip verification work?",
      a:
        "Students submit their absence reason alongside required medical " +
        "certificates or official excuse documentation. Once reviewed and " +
        "verified by guidance staff, a digital admission ticket is issued " +
        "instantly for presentation to subject professors.",
    },
    {
      q: "What should I do in an immediate mental health crisis?",
      a:
        "Urgent appointment submissions are prioritized on the counselor " +
        "queue. For immediate, round-the-clock emergency assistance, you may " +
        "contact the National Center for Mental Health (NCMH) toll-free hotline " +
        "at 1553.",
    },
  ];

  return (
    <Layout
      isLoggedIn={false}
      showHeader={true}
    >
      <div
        id="top"
        className="mx-auto max-w-5xl space-y-20 px-4 py-10 sm:px-6 sm:py-16 lg:px-8"
      >
        {/* Editorial Header / Hero */}
        <section className="max-w-3xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            PUP-T Guidance and Counseling Services
          </p>

          <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-5xl">
            Student welfare, psychological guidance, and academic support.
          </h1>

          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            The Guidance Services Information System (GuiSIS) is the official
            university channel for confidential counseling consultations,
            absence verification, and student inventory records.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button
              size="lg"
              onClick={handleLogin}
              className="h-11 gap-2 px-6 font-medium"
            >
              Log In <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById("services")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="h-11 font-medium"
            >
              Explore Services
            </Button>
          </div>
        </section>

        {/* Two Direct Action Portals (Editorial Dual Tiles) */}
        <section
          id="services"
          className="scroll-mt-24 space-y-6"
        >
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Primary Guidance Services
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select an option to proceed with your transaction.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Tile 1: Counseling Consultation */}
            <div className="flex flex-col justify-between space-y-6 rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/30 sm:p-8">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Counseling Consultations
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Confidential appointments for academic stress, emotional
                  concerns, or personal difficulties. Submissions are reviewed
                  with priority triage for urgent situations.
                </p>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 shrink-0 text-primary" />
                  <span>Conducted in private consultation rooms</span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogin}
                  className="w-full justify-between text-sm"
                >
                  Schedule an Appointment <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Tile 2: Admission & Excuse Slips */}
            <div className="flex flex-col justify-between space-y-6 rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/30 sm:p-8">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Admission & Excuse Slips
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Asynchronous submission of absence documentation, medical
                  certificates, and official excuse letters without manual
                  office queueing.
                </p>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0 text-primary" />
                  <span>Digital tickets issued upon staff review</span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogin}
                  className="w-full justify-between text-sm"
                >
                  File Excuse Documentation <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Operating Hours & Institutional Contact Directory */}
        <section
          id="contact"
          className="scroll-mt-24 space-y-6 rounded-lg border border-border bg-card p-6 sm:p-8"
        >
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Office Directory and Emergency Support
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              On-campus office location and 24/7 crisis hotlines.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                <span>Operating Hours</span>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                Monday to Friday
              </p>
              <p className="pl-6 text-xs text-muted-foreground">
                8:00 AM – 5:00 PM (Philippine Standard Time)
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>Office Location</span>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                Guidance and Counseling Office
              </p>
              <p className="pl-6 text-xs text-muted-foreground">
                PUP Taguig Campus, Bicutan, Taguig City
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>Technical & Office Inquiries</span>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                supportguisis@gmail.com
              </p>
            </div>
          </div>

          {/* Emergency Crisis Strip */}
          <div className="flex flex-col justify-between gap-3 rounded border border-border/80 bg-muted/40 p-4 text-xs sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <PhoneCall className="h-4 w-4 shrink-0 text-primary" />
              <span>
                National Center for Mental Health (NCMH) 24/7 Crisis Hotline:
              </span>
            </div>
            <span className="font-mono text-sm font-bold text-foreground">
              1553 (Luzon Toll-Free) / 0917-899-8727
            </span>
          </div>
        </section>

        {/* FAQs */}
        <section
          id="faq"
          className="scroll-mt-24 space-y-6"
        >
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Common procedures regarding counseling privacy and service
              processing.
            </p>
          </div>

          <div className="max-w-3xl space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="space-y-1.5 border-b border-border/60 pb-4"
              >
                <h3 className="flex items-start gap-2 text-sm font-semibold text-foreground">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {faq.q}
                </h3>
                <p className="pl-6 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
