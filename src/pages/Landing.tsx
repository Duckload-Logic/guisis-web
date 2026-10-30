import Layout from "@/components/layout/Layout";
import { API_ROUTES } from "@/config/apiRoutes";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  LogIn,
  Clock,
  MapPin,
  Mail,
  HeartHandshake,
  ShieldCheck,
  CalendarCheck,
  HelpCircle,
  PhoneCall,
  UserCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function Landing() {
  const isProd = import.meta.env.VITE_IS_PRODUCTION === "true";
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  const authorizeUrl = API_ROUTES.auth.idpAuthorizeUrl;
  const loginUrl = isProd ? `${apiBase}${authorizeUrl}` : "/login";

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"counseling" | "slips" | "iir">(
    "counseling"
  );

  const handleLogin = () => {
    if (isProd) {
      window.location.assign(loginUrl);
    } else {
      navigate(loginUrl);
    }
  };

  const pathways = [
    {
      id: "counseling",
      title: "Talk to a Counselor",
      tagline: "Confidential & Empathetic",
      desc:
        "Feeling overwhelmed by acads, relationships, or personal distress? " +
        "Book a one-on-one session with our licensed guidance personnel.",
      steps: [
        "Pick a schedule that fits your class-free hours",
        "Describe your concern in your own comfortable words",
        "Receive confidential guidance in a safe, non-judgmental space",
      ],
      cta: "Schedule a Consultation",
    },
    {
      id: "slips",
      title: "Request Admission Slip",
      tagline: "Quick & Asynchronous",
      desc:
        "Missed classes due to health issues or legitimate emergencies? " +
        "Submit your excuse documents online without standing in long queues.",
      steps: [
        "Upload your supporting medical certificate or excuse letter",
        "Counselor reviews and approves your submission",
        "Download your verified digital admission slip immediately",
      ],
      cta: "Submit Excuse Documentation",
    },
    {
      id: "iir",
      title: "Individual Inventory Record",
      tagline: "Your Digital Profile",
      desc:
        "Keep your student background and contact details updated. " +
        "Helps the university tailor student welfare programs for you.",
      steps: [
        "Sign in using your institutional webmail",
        "Auto-extract your current schedule from your COR",
        "Update family and emergency contact numbers",
      ],
      cta: "Update Your Profile",
    },
  ];

  const currentPathway =
    pathways.find((p) => p.id === activeTab) || pathways[0];

  const faqs = [
    {
      q: "Makikita ba ng professors o classmates ko ang counseling notes ko?",
      a:
        "Hindi po. Strictly confidential ang lahat ng counseling records " +
        "alinsunod sa Data Privacy Act (RA 10173). Tanging ang Guidance " +
        "Counselor lamang ang may access dito.",
    },
    {
      q: "Ano ang kailangan kong dalhin kapag may appointment ako?",
      a:
        "Wala na pong physical paper forms na kailangan. Dumating lang sa " +
        "guidance office sa napiling oras bitbit ang student ID.",
    },
    {
      q: "Paano kung emergency o kailangan ko ng agarang tulong?",
      a:
        "May automated urgency triage ang portal upang mauna sa pila ang " +
        "mga critical concerns. Maaari ring tumawag agad sa NCMH Crisis " +
        "Hotline (1553) para sa 24/7 emergency support.",
    },
  ];

  return (
    <Layout isLoggedIn={false} showHeader={true}>
      <div id="top" className="space-y-20 pb-20 overflow-hidden">
        {/* Warm Ambient Radial Accents */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div
            className={
              "absolute left-1/2 top-0 -translate-x-1/2 h-[28rem] w-[50rem] " +
              "rounded-full bg-gradient-to-b from-primary/10 via-secondary/10 " +
              "to-transparent blur-3xl opacity-70"
            }
          />
        </div>

        {/* Hero Section */}
        <section className="relative mx-auto max-w-5xl pt-10 sm:pt-16 px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            {/* Compassionate Badge */}
            <div
              className={
                "mb-6 inline-flex items-center gap-2 rounded-full border " +
                "border-border bg-card px-4 py-1.5 text-xs font-medium " +
                "text-foreground shadow-sm"
              }
            >
              <HeartHandshake className="h-4 w-4 text-primary" />
              <span>Your Safe Space at PUP Taguig</span>
            </div>

            {/* Main Compassionate Headline */}
            <h1
              className={
                "text-4xl font-extrabold tracking-tight text-foreground " +
                "sm:text-6xl max-w-3xl leading-[1.18]"
              }
            >
              You don&apos;t have to carry <br />
              <span
                className={
                  "text-primary underline decoration-secondary " +
                  "decoration-wavy decoration-2"
                }
              >
                everything alone.
              </span>
            </h1>

            {/* Subtext */}
            <p
              className={
                "mt-6 max-w-2xl text-base sm:text-lg leading-relaxed " +
                "text-muted-foreground"
              }
            >
              Welcome to the official Guidance Services Information System
              (GuiSIS). Whether you need someone to talk to, an excuse slip
              verified, or your student profile updated—we are here to support
              your college journey.
            </p>

            {/* Primary Action Group */}
            <div
              className={
                "mt-8 flex flex-col sm:flex-row items-center justify-center " +
                "gap-4 w-full sm:w-auto"
              }
            >
              <Button
                size="lg"
                className={
                  "w-full sm:w-auto gap-2.5 text-base font-semibold px-8 " +
                  "h-12 shadow-md hover:shadow-lg transition-all"
                }
                onClick={handleLogin}
              >
                <LogIn className="h-4 w-4" />
                Sign In with Webmail
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto text-base font-medium h-12"
                onClick={() =>
                  document.getElementById("pathways")?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                Explore Student Services
              </Button>
            </div>

            {/* Core Reassurances */}
            <div
              className={
                "mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full " +
                "max-w-3xl text-left"
              }
            >
              <div
                className={
                  "rounded-lg border border-border/80 bg-card/60 " +
                  "backdrop-blur-sm p-4 flex items-center gap-3"
                }
              >
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    100% Confidential
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Safe space protected by law
                  </p>
                </div>
              </div>
              <div
                className={
                  "rounded-lg border border-border/80 bg-card/60 " +
                  "backdrop-blur-sm p-4 flex items-center gap-3"
                }
              >
                <CalendarCheck className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Stress-Free Booking
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    No long queues outside office
                  </p>
                </div>
              </div>
              <div
                className={
                  "rounded-lg border border-border/80 bg-card/60 " +
                  "backdrop-blur-sm p-4 flex items-center gap-3"
                }
              >
                <UserCheck className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Professional Guidance
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Trained counselors ready to listen
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Interactive Guided Pathways */}
        <section
          id="pathways"
          className="scroll-mt-20 mx-auto max-w-5xl px-4 sm:px-6"
        >
          <div className="text-center mb-8">
            <h2
              className={
                "text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
              }
            >
              How can we help you today?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Select what you need to see how the guidance office can assist
              you.
            </p>
          </div>

          {/* Pathway Tabs */}
          <div
            className={
              "flex justify-center gap-2 p-1.5 rounded-xl border " +
              "border-border bg-muted/40 max-w-md mx-auto mb-8"
            }
          >
            {pathways.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(tab.id as "counseling" | "slips" | "iir")
                }
                className={
                  "flex-1 py-2 px-3 text-xs font-medium rounded-lg " +
                  "transition-all " +
                  (activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm font-semibold " +
                      "border border-border"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {tab.title}
              </button>
            ))}
          </div>

          {/* Active Pathway Content Card */}
          <div
            className={
              "rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-sm " +
              "grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            }
          >
            <div className="lg:col-span-7 space-y-4">
              <span
                className={
                  "text-xs font-semibold uppercase tracking-wider text-primary"
                }
              >
                {currentPathway.tagline}
              </span>
              <h3 className="text-2xl font-bold text-foreground">
                {currentPathway.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentPathway.desc}
              </p>

              <div className="pt-2 space-y-2.5">
                <p
                  className={
                    "text-xs font-semibold uppercase tracking-wide " +
                    "text-muted-foreground"
                  }
                >
                  Simple 3-Step Process:
                </p>
                {currentPathway.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      {step}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleLogin}
                  className="gap-2 text-sm font-semibold"
                >
                  {currentPathway.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Interactive Visual Aside */}
            <div
              className={
                "lg:col-span-5 rounded-xl border border-border/80 bg-muted/20 " +
                "p-6 space-y-4 text-xs text-muted-foreground"
              }
            >
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Guidance Office Notice</span>
              </div>
              <p className="leading-relaxed">
                All consultations are held in a private counseling cubicle. If
                you prefer an online consultation due to scheduling constraints,
                you can specify it during appointment booking.
              </p>
              <div
                className={
                  "border-t border-border/60 pt-3 flex items-center " +
                  "justify-between text-[11px]"
                }
              >
                <span>Office: Ground Floor, Admin Bldg</span>
                <span className="text-primary font-medium">Mon–Fri 8AM–5PM</span>
              </div>
            </div>
          </div>
        </section>

        {/* Support, Crisis Hotline & FAQ Split */}
        <section
          id="faq"
          className={
            "scroll-mt-20 mx-auto max-w-5xl px-4 sm:px-6 grid grid-cols-1 " +
            "lg:grid-cols-12 gap-8"
          }
        >
          {/* FAQ Column (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Frequently Asked Questions
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Mababawasan ang kaba kapag alam mo ang proseso.
              </p>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={
                    "rounded-xl border border-border bg-card p-4 space-y-1.5 " +
                    "shadow-sm"
                  }
                >
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                    {faq.q}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact & Urgent Crisis Card (5 cols) */}
          <div
            id="contact"
            className={
              "lg:col-span-5 rounded-xl border border-border bg-card p-6 " +
              "shadow-sm flex flex-col justify-between space-y-6"
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <HeartHandshake className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    Guidance Office Desk
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    PUP Taguig Campus
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>Monday – Friday: 8:00 AM – 5:00 PM</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>Ground Floor, Guidance & Counseling Center</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>supportguisis@gmail.com</span>
                </div>
              </div>

              {/* 24/7 Crisis Hotline Fallback */}
              <div
                className={
                  "rounded-lg border border-primary/20 bg-primary/5 p-3.5 " +
                  "space-y-1.5 text-xs"
                }
              >
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <PhoneCall className="h-4 w-4" />
                  <span>24/7 Crisis Support Hotlines</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  If you or someone you know is in immediate psychological
                  distress:
                </p>
                <div className="font-mono text-xs font-bold text-foreground">
                  NCMH Hotline: 1553 (Luzon-wide toll-free)
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full text-xs font-semibold h-10"
              onClick={() => {
                window.location.href = "mailto:supportguisis@gmail.com";
              }}
            >
              Email Guidance Desk
            </Button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
