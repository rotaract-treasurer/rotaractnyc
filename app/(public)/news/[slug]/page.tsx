import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getArticleBySlug } from '@/lib/firebase/queries';
import { formatDate } from '@/lib/utils/format';
import Badge from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  return (
    <>
      <section className="relative py-28 sm:py-36 bg-gradient-to-br from-cranberry-900 via-cranberry to-cranberry-800 text-white">
        <div className="container-page relative z-10">
          <Link href="/news" className="inline-flex items-center gap-1 text-cranberry-200 hover:text-white text-sm mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to News
          </Link>
          <Badge variant="gold" className="mb-4">{article.category}</Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold max-w-3xl">{article.title}</h1>
          <div className="mt-4 flex items-center gap-4 text-cranberry-200 text-sm">
            <span>By {article.author.name}</span>
            {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-page">
          <div className="max-w-3xl mx-auto prose prose-lg dark:prose-invert" dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </section>
    </>
  );
}
