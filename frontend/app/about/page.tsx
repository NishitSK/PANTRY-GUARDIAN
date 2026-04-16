import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-textMain px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl border-4 border-black bg-white p-8 shadow-[10px_10px_0_#000]">
        <p className="inline-block bg-[#FFE66D] border-2 border-black px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.32em] text-black">About Pantry Guardian</p>
        <h1 className="mt-4 font-anton text-5xl uppercase leading-[0.9]">Brutalist <span className="bg-[#93E1A8] px-2">food waste</span> control</h1>
        <p className="mt-6 font-ibm-mono text-sm leading-7 text-textMuted">
          Pantry Guardian helps households and students track inventory, monitor expiry risk,
          and act before food spoils. It combines storage-aware shelf-life logic, weather context,
          and clear urgency signals to reduce waste.
        </p>

        <section className="mt-8 border-2 border-black p-5 bg-[#F6F1E7]">
          <h2 className="font-anton text-3xl uppercase leading-none">What this product solves</h2>
          <p className="mt-4 font-ibm-mono text-sm leading-7 text-textMuted">
            Most pantry apps fail because they behave like static checklists. Pantry Guardian is built as an
            active decision system: it estimates when items are likely to spoil, ranks urgency, and pushes
            clear actions to the dashboard before value is lost.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="border-2 border-black p-5 bg-[#DDF5E3]">
            <p className="font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">Core Features</p>
            <ul className="mt-4 space-y-2 font-ibm-mono text-sm leading-6 text-textMuted">
              <li>Storage-aware expiry prediction (room, fridge, freezer)</li>
              <li>Weather-assisted shelf-life adjustments</li>
              <li>Spoilage alerts with in-app and browser notifications</li>
              <li>Inventory workflows for add, edit, and urgency review</li>
            </ul>
          </div>

          <div className="border-2 border-black p-5 bg-[#FFF4CC]">
            <p className="font-ibm-mono text-[10px] uppercase tracking-[0.28em] text-textMuted">Who It Is For</p>
            <ul className="mt-4 space-y-2 font-ibm-mono text-sm leading-6 text-textMuted">
              <li>Busy households trying to reduce avoidable waste</li>
              <li>Students and shared kitchens with limited budget</li>
              <li>Health-conscious users tracking freshness windows</li>
              <li>Anyone who wants fewer pantry decisions per day</li>
            </ul>
          </div>
        </section>

        <section className="mt-6 border-2 border-black p-5 bg-[#EAF2FF]">
          <h2 className="font-anton text-3xl uppercase leading-none">Trust and Product Principles</h2>
          <p className="mt-4 font-ibm-mono text-sm leading-7 text-textMuted">
            Pantry Guardian is intentionally transparent: predictions are advisory, not hidden black-box rules.
            We prioritize clear labeling, practical urgency states, and simple controls that let users verify
            item condition and make the final call.
          </p>
          <p className="mt-3 font-ibm-mono text-sm leading-7 text-textMuted">
            Product direction is focused on reliability first: faster page response, stronger data consistency,
            and clearer day-to-day actions in the dashboard.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/qna" className="border-2 border-black bg-[#FFE66D] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Q&A</Link>
          <Link href="/support" className="border-2 border-black bg-[#93E1A8] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Support</Link>
          <Link href="/privacy" className="border-2 border-black bg-[#DDE8FF] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Privacy</Link>
          <Link href="/terms" className="border-2 border-black bg-white px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Terms</Link>
          <Link href="/" className="border-2 border-black bg-black text-white px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
