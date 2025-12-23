import Link from 'next/link'

export default function Archive20212022Page() {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="inline-flex items-center rounded-full border border-rotaract-pink/20 bg-rotaract-pink/5 px-4 py-1 text-sm text-rotaract-darkpink">
            Archive
          </div>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold text-rotaract-darkpink tracking-tight">
            2021–2022
          </h1>
          <p className="mt-4 text-lg text-gray-700 leading-relaxed">
            This page mirrors the live-site archive entry. If you’d like this archive to include specific photos,
            names, and event recap details, tell me what you want shown and I’ll match it.
          </p>

          <div className="mt-10 grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-bold text-rotaract-darkpink">Highlights</h2>
              <ul className="mt-3 space-y-2 text-gray-700">
                <li>• Service initiatives and community impact</li>
                <li>• Member engagement and leadership development</li>
                <li>• UN-adjacent programming and partnerships</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-xl font-bold text-rotaract-darkpink">Related</h2>
              <p className="mt-3 text-gray-700">See the annual reception page.</p>
              <div className="mt-4">
                <Link
                  href="/20212022-annual-reception"
                  className="inline-flex rounded-lg bg-rotaract-pink px-5 py-2.5 font-semibold text-white hover:bg-rotaract-darkpink transition-colors"
                >
                  2021–2022 Annual Reception
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
