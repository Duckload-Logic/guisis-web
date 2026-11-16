import Layout from "@/components/layout/Layout";

export default function About() {
  return (
    <Layout
      showHeader
      isLoggedIn={false}
    >
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            About PUP Guidance Services
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            The Guidance Services Information System (GuiSIS) is the official
            university channel for confidential counseling consultations,
            absence verification, and student inventory records for the
            Polytechnic University of the Philippines – Taguig.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <h2 className="text-lg font-semibold text-foreground">
                Institutional Mandate
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Operating strictly under Republic Act No. 9258 and RA 10173
                (Data Privacy Act of 2012), all student records and session notes
                remain strictly confidential.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-5">
              <h2 className="text-lg font-semibold text-foreground">
                Who Can Access
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Authorized students, guidance counselors, and administrators
                access services via official university credentials to submit,
                manage, and review guidance requests.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
