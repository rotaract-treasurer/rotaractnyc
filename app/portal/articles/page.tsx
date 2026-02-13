'use client';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { defaultArticles } from '@/lib/defaults/data';
import { formatDate } from '@/lib/utils/format';

export default function PortalArticlesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Articles</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Read stories and updates from our community.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {defaultArticles.map((article) => (
          <Card key={article.id} interactive padding="none" className="overflow-hidden">
            <div className="h-36 bg-gradient-to-br from-cranberry-100 to-cranberry-50 dark:from-cranberry-900/20 dark:to-cranberry-950/30" />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="cranberry">{article.category}</Badge>
                <span className="text-xs text-gray-400">{article.publishedAt ? formatDate(article.publishedAt) : ''}</span>
              </div>
              <h3 className="font-display font-bold text-gray-900 dark:text-white line-clamp-2">{article.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{article.excerpt}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <span>By {article.author.name}</span>
                <span>·</span>
                <span>{article.viewCount} views</span>
                <span>·</span>
                <span>❤️ {article.likeCount}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
