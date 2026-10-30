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
    <Layout isLoggedIn={false} showHeader={true}>
      <div id="top" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-20">
        {/* Editorial Header / Hero */}
        <section className="space-y-6 max-w-3xl">
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            PUP-T Guidance and Counseling Services
          </p>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
            Student welfare, psychological guidance, and academic support.
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            The Guidance Services Information System (GuiSIS) is the official
            university channel for confidential counseling consultations,
            absence verification, and student inventory records.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={handleLogin}
              className="gap-2 font-medium px-6 h-11"
            >
              Sign In with University Webmail <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById("services")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
              className="font-medium h-11"
            >
              Explore Services
            </Button>
          </div>
        </section>

        {/* Two Direct Action Portals (Editorial Dual Tiles) */}
        <section id="services" className="scroll-mt-24 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Primary Guidance Services
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select an option to proceed with your transaction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tile 1: Counseling Consultation */}
            <div className="rounded-lg border border-border bg-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-foreground/30 transition-colors">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Counseling Consultations
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Confidential appointments for academic stress, emotional
                  concerns, or personal difficulties. Submissions are reviewed
                  with priority triage for urgent situations.
                </p>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
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
            <div className="rounded-lg border border-border bg-card p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-foreground/30 transition-colors">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Admission & Excuse Slips
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Asynchronous submission of absence documentation, medical
                  certificates, and official excuse letters without manual
                  office queueing.
                </p>
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
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
        <section id="contact" className="scroll-mt-24 rounded-lg border border-border bg-card p-6 sm:p-8 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Office Directory and Emergency Support
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              On-campus office location and 24/7 crisis hotlines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Clock className="h-4 w-4 text-primary shrink-0" />
                <span>Operating Hours</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Monday to Friday
              </p>
              <p className="text-xs text-muted-foreground pl-6">
                8:00 AM – 5:00 PM (Philippine Standard Time)
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span>Office Location</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Guidance and Counseling Office
              </p>
              <p className="text-xs text-muted-foreground pl-6">
                PUP Taguig Campus, Bicutan, Taguig City
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>Technical & Office Inquiries</span>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                supportguisis@gmail.com
              </p>
            </div>
          </div>

          {/* Emergency Crisis Strip */}
          <div className="rounded border border-border/80 bg-muted/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <PhoneCall className="h-4 w-4 text-primary shrink-0" />
              <span>National Center for Mental Health (NCMH) 24/7 Crisis Hotline:</span>
            </div>
            <span className="font-mono font-bold text-foreground text-sm">
              1553 (Luzon Toll-Free) / 0917-899-8727
            </span>
          </div>
        </section>

        {/* FAQs */}
        <section id="faq" className="scroll-mt-24 space-y-6">
          <div className="border-b border-border pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Common procedures regarding counseling privacy and service processing.
            </p>
          </div>

          <div className="space-y-4 max-w-3xl">
            {faqs.map((faq, i) => (
              <div key={i} className="space-y-1.5 border-b border-border/60 pb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-6">
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
