import Link from 'next/link'

const faqs = [
  {
    q: 'How are expiry alerts calculated?',
    a: 'Pantry Guardian uses product shelf life, storage method, purchase/open dates, and weather context to estimate expiry windows.',
  },
  {
    q: 'Will I get spoilage notifications?',
    a: 'Yes. In-app spoilage alerts are shown, and browser notifications are available if you enable permission.',
  },
  {
    q: 'Can I set my location manually?',
    a: 'Yes. You can update city in Settings or detect location automatically to improve weather-aware predictions.',
  },
  {
    q: 'How often are spoilage notifications checked?',
    a: 'The app checks inventory periodically in the background while you are in the dashboard experience, and it can also send browser alerts if enabled.',
  },
  {
    q: 'Can teams or families share one pantry?',
    a: 'Today each account has its own pantry. Shared household views are part of the product roadmap for future releases.',
  },
]

export default function QnaPage() {
  return (
    <main className="min-h-screen bg-background text-textMain px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl border-4 border-black bg-white p-8 shadow-[10px_10px_0_#000]">
        <p className="inline-block bg-[#FFE66D] border-2 border-black px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.32em] text-black">Q and A</p>
        <h1 className="mt-4 font-anton text-5xl uppercase leading-[0.9]">Common <span className="bg-[#DDE8FF] px-2">Questions</span></h1>
        <p className="mt-5 font-ibm-mono text-sm leading-7 text-textMuted">
          This page covers how Pantry Guardian works in real kitchens: prediction rules,
          notifications, data handling, and what to do when something looks off.
        </p>

        <section className="mt-6 border-2 border-black bg-[#F6F1E7] p-4">
          <h2 className="font-anton text-2xl uppercase">Quick Product Notes</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="border-2 border-black bg-[#DDF5E3] p-3">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-black/70">Predictions</p>
              <p className="mt-2 font-ibm-mono text-sm text-black/80">Storage and freshness logic are transparent and rule-based.</p>
            </div>
            <div className="border-2 border-black bg-[#FFF4CC] p-3">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-black/70">Notifications</p>
              <p className="mt-2 font-ibm-mono text-sm text-black/80">In-app spoilage signals are always visible for urgent items.</p>
            </div>
            <div className="border-2 border-black bg-[#EAF2FF] p-3">
              <p className="font-ibm-mono text-[10px] uppercase tracking-[0.2em] text-black/70">Control</p>
              <p className="mt-2 font-ibm-mono text-sm text-black/80">You decide final action for every item after visual check.</p>
            </div>
          </div>
        </section>

        <div className="mt-8 space-y-4">
          {faqs.map((f) => (
            <div key={f.q} className="border-2 border-black p-4 bg-white">
              <h2 className="font-anton text-2xl uppercase">{f.q}</h2>
              <p className="mt-2 font-ibm-mono text-sm leading-7 text-textMuted">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/about" className="border-2 border-black bg-[#93E1A8] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">About</Link>
          <Link href="/support" className="border-2 border-black bg-[#FFE66D] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Support</Link>
          <Link href="/privacy" className="border-2 border-black bg-[#DDE8FF] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Privacy</Link>
          <Link href="/" className="border-2 border-black bg-black text-white px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
