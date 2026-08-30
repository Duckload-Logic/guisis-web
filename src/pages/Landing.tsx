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
  ShieldCheck,
  ChevronRight,
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
    if (isProd) window.open(loginUrl, "_self");
    else navigate(loginUrl);
  };

  const faqs = [
    {
      q: "How do I log in to GuiSIS?",
      a: "You must use your official university credentials via the integrated Identity Provider (IDP) login option.",
    },
    {
      q: "Can I request guidance support off-campus?",
      a: "Yes, the portal allows you to book appointments and request admission slips directly online.",
    },
    {
      q: "How do I create an account?",
      a: "You don't need to manually create one. Just use your official university credentials via the integrated IDP.",
    },
  ];

  return (
    <Layout
      isLoggedIn={false}
      showHeader={true}
    >
      <div
        id="top"
        className="relative space-y-12 pb-12"
      >
        {/* Ambient Background Accents */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-[10%] top-[10%] h-[50rem] w-[50rem] rounded-full bg-primary/10 blur-[100px] dark:bg-primary/5" />
          <div className="absolute -right-[10%] top-[40%] h-[40rem] w-[40rem] rounded-full bg-secondary/20 blur-[100px] dark:bg-secondary/5" />
          <div className="absolute left-[20%] top-[80%] h-[45rem] w-[45rem] rounded-full bg-primary/5 blur-[100px] dark:bg-primary/5" />
        </div>
        {/* Asymmetric Hero Section */}
        <section className="relative flex min-h-[80vh] flex-col items-center overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex-row">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-100 dark:opacity-50" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background/60 via-background/10 to-transparent dark:from-background/80" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 w-full px-6 py-12 sm:px-12 lg:w-3/5 lg:py-24"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary shadow-sm backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4" />
              Official Portal for PUP-Taguig GuiSIS
            </div>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Guidance & Support <br />
              <span className="text-primary">Modernized.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Built exclusively for Polytechnic University of the Philippines –
              Taguig. Access counseling appointments, admission slips, and
              mental health resources securely.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                size="lg"
                className="gap-2 font-semibold shadow-md transition-transform hover:-translate-y-0.5"
                onClick={handleLogin}
              >
                Login with IDP <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="font-semibold"
                onClick={() =>
                  document.getElementById("features")?.scrollIntoView()
                }
              >
                Explore Features
              </Button>
            </div>
          </motion.div>

          {/* Hero Visual Accent (Bento Style Preview) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative z-10 flex h-full w-full flex-col justify-center gap-4 p-6 sm:p-12 lg:w-2/5 lg:pl-0"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 rounded-xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur-md transition-all hover:border-primary/30">
                <div className="mb-3 flex items-center gap-4">
                  <div className="rounded-lg bg-secondary/15 p-2.5 text-secondary-foreground">
                    <Calendar className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="font-semibold">Quick Scheduling</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Book appointments instantly without falling in line.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur-md transition-all hover:border-primary/30">
                <FileText className="mb-3 h-6 w-6 text-primary" />
                <h3 className="text-sm font-semibold">Admission Slips</h3>
              </div>
              <div className="rounded-xl border border-border bg-background/80 p-6 shadow-sm backdrop-blur-md transition-all hover:border-primary/30">
                <MessageSquare className="mb-3 h-6 w-6 text-secondary" />
                <h3 className="text-sm font-semibold">Direct Support</h3>
              </div>
            </div>
          </motion.div>
        </section>

        <div className="animate-divider-in mx-auto h-px w-3/4 max-w-3xl bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* About Section */}
        <section
          id="about"
          className="py-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid items-center gap-10 rounded-2xl border border-border bg-muted/30 p-8 shadow-sm transition-all hover:border-primary/30 sm:p-12 lg:grid-cols-2"
          >
            <div className="max-w-lg space-y-6">
              <div className="mb-2 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight">
                The gateway for guidance and support.
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Built for the Polytechnic University of the Philippines Taguig,
                GuiSIS is designed to support students with secure access to
                academic guidance, counseling services, and official resources.
              </p>
            </div>

            <div className="w-full max-w-md space-y-8 lg:ml-auto">
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  Secure by default
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Only authenticated students and staff can access the system,
                  with all sessions routed through the university IDP.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <div className="h-2 w-2 rounded-full bg-secondary" />
                  Easy navigation
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  A clean, modern interface gives you fast access to guidance
                  resources, appointments, and support contacts.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        <div className="animate-divider-in mx-auto h-px w-3/4 max-w-3xl bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Feature Bento Grid */}
        <section
          id="features"
          className="py-12"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight">Core Services</h2>
            <p className="mt-2 text-muted-foreground">
              Everything you need, securely authenticated.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/40 hover:shadow-md md:col-span-2"
            >
              <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-all group-hover:bg-primary/10" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">
                  Counseling Appointments
                </h3>
                <p className="max-w-md leading-relaxed text-muted-foreground">
                  Manage your mental health journey. Request, track, and follow
                  up on guidance appointments through a streamlined dashboard.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-secondary/40 hover:shadow-md"
            >
              <div className="absolute bottom-0 right-0 -mb-10 -mr-10 h-40 w-40 rounded-full bg-secondary/10 blur-2xl transition-all group-hover:bg-secondary/20" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-xl bg-secondary/15 p-3 text-secondary-foreground">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold">Admission Slips</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Submit excuse letters and fetch admission slips online.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-xl bg-muted p-3 text-foreground">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold">SSO Integration</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Zero password fatigue. Login directly with your university
                  email.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/40 hover:shadow-md md:col-span-2"
            >
              <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl transition-all group-hover:bg-primary/10" />
              <div className="relative z-10">
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">
                  Direct Communication
                </h3>
                <p className="max-w-md leading-relaxed text-muted-foreground">
                  Reach out to the guidance office anytime. Safe, private, and
                  recorded for your peace of mind.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="animate-divider-in mx-auto h-px w-3/4 max-w-3xl bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Contact & FAQ Split */}
        <section
          id="support"
          className="grid grid-cols-1 gap-8 py-12 lg:grid-cols-2"
        >
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Need help? We've got you covered.
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="group rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30"
                >
                  <div className="flex gap-4">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div>
                      <h4 className="text-sm font-semibold">{faq.q}</h4>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col justify-between rounded-2xl border border-border bg-primary/5 p-8"
          >
            <div>
              <div className="mb-6 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-2xl font-bold">Still need help?</h2>
              <p className="text-muted-foreground">
                Our support team is available during office hours.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-center gap-4 border-b border-border pb-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Tech Support</p>
                    <p className="text-sm text-muted-foreground">
                      supportguisis@gmail.com
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Guidance Office</p>
                    <p className="text-sm text-muted-foreground">
                      PUP Taguig Campus
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="mt-8 w-full gap-2"
              variant="outline"
              onClick={() =>
                (window.location.href = "mailto:supportguisis@gmail.com")
              }
            >
              Email Support <ChevronRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </section>
      </div>
    </Layout>
  );
}
