import Layout from "@/components/layout/Layout";

export default function Contact() {
  return (
    <Layout
      showHeader
      isLoggedIn={false}
    >
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-border bg-card p-8 shadow-sm backdrop-blur-2xl">
          <h1 className="text-4xl font-semibold text-foreground">Contact Us</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
            Need help with your GuiSIS account or guidance services? Reach out
            to the PUP Taguig Guidance Office using the details below.
          </p>
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground">
                Guidance Office
              </h2>
              <p className="mt-3 text-muted-foreground">
                Phone: (02) 1234-5678
              </p>
              <p className="mt-1 text-muted-foreground">
                Email: guidance@pup.edu.ph
              </p>
            </div>
            <div className="rounded-3xl border border-border p-6">
              <h2 className="text-xl font-semibold text-foreground">
                Technical Support
              </h2>
              <p className="mt-3 text-muted-foreground">
                Email: support@pup.edu.ph
              </p>
              <p className="mt-1 text-muted-foreground">
                Office hours: Monday to Friday, 8:00 AM to 5:00 PM
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
