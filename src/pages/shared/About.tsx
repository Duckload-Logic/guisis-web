import Layout from "@/components/layout/Layout";

export default function About() {
  return (
    <Layout showHeader isLoggedIn={false}>
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-slate-200/70 bg-slate-50/90 p-8 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.25)] backdrop-blur-2xl dark:border-stone-700/70 dark:bg-stone-800/95">
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white">About PUP Guidance Services</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 dark:text-slate-300">
            The Guidance Services Information System (GuiSIS) helps students access counseling, appointments, and support services from the Polytechnic University of the Philippines – Taguig.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 p-6 dark:border-stone-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Our Mission</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">To provide secure, easy access to guidance support, appointments, and student records through a modern online portal.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 p-6 dark:border-stone-700">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Who Can Use It</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">Currently, authorized students, guidance advisors, and administrators can log in through the university IDP to manage guidance services.</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
