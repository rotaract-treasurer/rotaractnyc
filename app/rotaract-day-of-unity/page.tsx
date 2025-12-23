import Link from 'next/link'

export default function RotaractDayOfUnityPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="inline-flex items-center rounded-full border border-rotaract-pink/20 bg-rotaract-pink/5 px-4 py-1 text-sm text-rotaract-darkpink">
            Campaign
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-rotaract-darkpink tracking-tight">
            Rotaract Day of Unity
          </h1>
          <p className="mt-4 text-lg text-gray-700 leading-relaxed">
            This page exists on the live site and is now supported here.
            If you want the exact copy and assets imported, share the text/images you want included.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link
              href="/mission"
              className="inline-flex justify-center rounded-lg bg-rotaract-pink px-6 py-3 font-semibold text-white hover:bg-rotaract-darkpink transition-colors"
            >
              Our Mission
            </Link>
            <Link
              href="/donate-now"
              className="inline-flex justify-center rounded-lg border border-rotaract-pink/30 bg-white px-6 py-3 font-semibold text-rotaract-pink hover:bg-rotaract-pink/5 transition-colors"
            >
              Donate
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
