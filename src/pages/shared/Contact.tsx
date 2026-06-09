import Layout from "@/components/layout/Layout";

export default function Contact() {
  return (
    <Layout showHeader isLoggedIn={false}>
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-slate-200/70 bg-slate-50/90 p-8 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.25)] backdrop-blur-2xl dark:border-stone-700/70 dark:bg-stone-800/95">
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">Contact Us</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
            Need help with your GuiSIS account or guidance services? Reach out to the PUP Taguig Guidance Office using the details below.
          </p>
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-slate-200 p-6 dark:border-stone-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Guidance Office</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">Phone: (02) 1234-5678</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">Email: guidance@pup.edu.ph</p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-6 dark:border-stone-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Technical Support</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">Email: support@pup.edu.ph</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">Office hours: Monday to Friday, 8:00 AM to 5:00 PM</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
