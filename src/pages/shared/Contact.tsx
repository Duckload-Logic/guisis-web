import Layout from "@/components/layout/Layout";

export default function Contact() {
  return (
    <Layout
      showHeader
      isLoggedIn={false}
    >
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Office Directory & Support
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Reach out to the Polytechnic University of the Philippines – Taguig
            Guidance and Counseling Office for academic concerns, admission
            documentation, or counseling consultations.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <h2 className="text-lg font-semibold text-foreground">
                Guidance Office
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Location: Guidance & Counseling Office, 2nd Floor
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Hours: Monday – Friday, 8:00 AM – 5:00 PM
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <h2 className="text-lg font-semibold text-foreground">
                Emergency & Crisis Hotline
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                National Center for Mental Health (NCMH): 1553 (Toll-Free)
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Available 24/7 for immediate psychological support.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
