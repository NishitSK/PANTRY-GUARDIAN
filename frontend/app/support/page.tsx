import Link from 'next/link'

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background text-textMain px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl border-4 border-black bg-white p-8 shadow-[10px_10px_0_#000]">
        <p className="inline-block bg-[#93E1A8] border-2 border-black px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.32em] text-black">Support</p>
        <h1 className="mt-4 font-anton text-5xl uppercase leading-[0.9]">Need <span className="bg-[#FFE66D] px-2">help</span>?</h1>
        <p className="mt-6 font-ibm-mono text-sm leading-7 text-textMuted">
          For issues with login, inventory sync, or spoilage alerts, send us feedback through
          the in-app channels and include screenshots plus the route where the issue occurs.
        </p>

        <section className="mt-6 border-2 border-black bg-[#F6F1E7] p-5">
          <h2 className="font-anton text-2xl uppercase">Fastest way to resolve issues</h2>
          <ol className="mt-4 space-y-2 font-ibm-mono text-sm leading-7 text-textMuted list-decimal pl-5">
            <li>Note the exact page route where the issue happened.</li>
            <li>Add one screenshot and one sentence with expected behavior.</li>
            <li>Share if issue happens every time or intermittently.</li>
            <li>Include whether location, weather, or notifications are involved.</li>
          </ol>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="border-2 border-black bg-[#EAF2FF] p-4">
            <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-black/70">Typical Requests</p>
            <ul className="mt-3 space-y-2 font-ibm-mono text-sm text-textMuted">
              <li>Auth and session issues</li>
              <li>Inventory item mismatch</li>
              <li>Prediction date concerns</li>
              <li>Route loading delays</li>
            </ul>
          </div>
          <div className="border-2 border-black bg-[#FFF4CC] p-4">
            <p className="font-ibm-mono text-[10px] uppercase tracking-[0.3em] text-black/70">Response Priorities</p>
            <ul className="mt-3 space-y-2 font-ibm-mono text-sm text-textMuted">
              <li>Data correctness and visibility</li>
              <li>Login and route access issues</li>
              <li>Notification reliability</li>
              <li>UI consistency and readability</li>
            </ul>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/qna" className="border-2 border-black bg-[#DDE8FF] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Q&A</Link>
          <Link href="/privacy" className="border-2 border-black bg-white px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Privacy</Link>
          <Link href="/terms" className="border-2 border-black bg-[#FFE66D] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Terms</Link>
          <Link href="/" className="border-2 border-black bg-black text-white px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
