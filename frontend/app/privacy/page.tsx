import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-textMain px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl border-4 border-black bg-white p-8 shadow-[10px_10px_0_#000]">
        <p className="inline-block bg-[#DDE8FF] border-2 border-black px-2 py-1 font-ibm-mono text-[10px] uppercase tracking-[0.32em] text-black">Privacy</p>
        <h1 className="mt-4 font-anton text-5xl uppercase leading-[0.9]">Privacy Policy</h1>
        <p className="mt-6 font-ibm-mono text-sm leading-7 text-textMuted">
          Pantry Guardian stores only data required for account access and inventory features,
          including product entries, usage notes, and location for weather-aware predictions.
          You can update or remove your inventory records from the dashboard.
        </p>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="border-2 border-black bg-[#F6F1E7] p-4">
            <h2 className="font-anton text-2xl uppercase">Data We Process</h2>
            <ul className="mt-3 space-y-2 font-ibm-mono text-sm text-textMuted">
              <li>Account identity and profile basics</li>
              <li>Inventory items and storage choices</li>
              <li>Prediction records and freshness timelines</li>
              <li>Optional location for weather context</li>
            </ul>
          </div>
          <div className="border-2 border-black bg-[#DDF5E3] p-4">
            <h2 className="font-anton text-2xl uppercase">Your Controls</h2>
            <ul className="mt-3 space-y-2 font-ibm-mono text-sm text-textMuted">
              <li>Edit location or remove it anytime</li>
              <li>Delete inventory items from the app</li>
              <li>Disable browser notifications anytime</li>
              <li>Use support channels for account requests</li>
            </ul>
          </div>
        </section>

        <section className="mt-6 border-2 border-black bg-[#FFF4CC] p-5">
          <h2 className="font-anton text-2xl uppercase">Privacy principle</h2>
          <p className="mt-3 font-ibm-mono text-sm leading-7 text-textMuted">
            We keep data usage scoped to product functionality: inventory management, predictions,
            and alerts. We do not use your pantry data for unrelated advertising behavior.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/terms" className="border-2 border-black bg-[#FFE66D] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Terms</Link>
          <Link href="/support" className="border-2 border-black bg-[#93E1A8] px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Support</Link>
          <Link href="/qna" className="border-2 border-black bg-white px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Q&A</Link>
          <Link href="/" className="border-2 border-black bg-black text-white px-4 py-2 font-ibm-mono text-[10px] uppercase tracking-[0.28em] hover:-translate-y-1 transition-transform">Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
