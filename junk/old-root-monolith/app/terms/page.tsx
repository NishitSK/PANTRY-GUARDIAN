import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-textMain px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl border-4 border-black bg-white p-8 shadow-[10px_10px_0_#000]">
        <p className="inline-block bg-[#FFE66D] border-2 border-black px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.32em] text-black">Terms</p>
        <h1 className="mt-4 font-anton text-5xl uppercase leading-[0.9]">Terms of Use</h1>
        <p className="mt-6 font-ibm-mono text-sm leading-7 text-textMuted">
          Use Pantry Guardian responsibly. Prediction outputs are advisory and should not replace
          food safety best practices. Always verify item condition before consumption.
        </p>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="border-2 border-black bg-[#F6F1E7] p-4">
            <h2 className="font-anton text-2xl uppercase">Acceptable Use</h2>
            <ul className="mt-3 space-y-2 font-ibm-mono text-sm text-textMuted">
              <li>Use accurate inventory and storage data when possible</li>
              <li>Do not misuse automation or abuse service endpoints</li>
              <li>Keep account access secure and private</li>
              <li>Respect applicable food safety guidance in your region</li>
            </ul>
          </div>
          <div className="border-2 border-black bg-[#EAF2FF] p-4">
            <h2 className="font-anton text-2xl uppercase">Service Expectations</h2>
            <ul className="mt-3 space-y-2 font-ibm-mono text-sm text-textMuted">
              <li>Predictions are estimates, not guarantees</li>
              <li>Features may evolve as product improves</li>
              <li>Temporary downtime may occur during updates</li>
              <li>Critical issues are prioritized for resolution</li>
            </ul>
          </div>
        </section>

        <section className="mt-6 border-2 border-black bg-[#DDF5E3] p-5">
          <h2 className="font-anton text-2xl uppercase">Safety Reminder</h2>
          <p className="mt-3 font-ibm-mono text-sm leading-7 text-textMuted">
            Pantry Guardian is designed to help decisions, not replace common-sense inspection.
            If an item smells, looks, or tastes unsafe, discard it regardless of predicted date.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/privacy" className="border-2 border-black bg-[#DDE8FF] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Privacy</Link>
          <Link href="/qna" className="border-2 border-black bg-[#FFE66D] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Q&A</Link>
          <Link href="/support" className="border-2 border-black bg-[#93E1A8] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Support</Link>
          <Link href="/" className="border-2 border-black bg-black text-white px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
