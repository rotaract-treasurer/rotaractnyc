import Link from 'next/link'

type Props = {
  params: { slug: string[] }
}

export default function NewsArticlePage({ params }: Props) {
  const slug = (params.slug || []).join('/')

  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-rotaract-pink/20 bg-rotaract-pink/5 px-4 py-1 text-sm text-rotaract-darkpink">
            RCUN News
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold text-rotaract-darkpink tracking-tight">
            Article
          </h1>
          <p className="mt-2 text-sm text-gray-500">Path: /rcun-news/{slug}</p>

          <div className="prose prose-gray mt-8 max-w-none">
            <p>
              This route supports the live-site article links (for example the Ukraine statement URL).
              If you want the exact article content imported, send me the text (or authorize a full scrape)
              and I’ll populate it.
            </p>
          </div>

          <div className="mt-10">
            <Link
              href="/rcun-news"
              className="inline-flex rounded-lg border border-rotaract-pink/30 bg-white px-5 py-2.5 font-semibold text-rotaract-pink hover:bg-rotaract-pink/5 transition-colors"
            >
              Back to News
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
