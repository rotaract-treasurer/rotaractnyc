import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/format';
import type { Article } from '@/types';

const categoryColors: Record<string, 'cranberry' | 'azure' | 'green' | 'gold' | 'gray'> = {
  Service: 'azure',
  Leadership: 'cranberry',
  International: 'green',
  Fellowship: 'gold',
};

interface ArticleCardProps {
  article: Article;
  onDelete?: (id: string) => void;
  canManage?: boolean;
}

export default function ArticleCard({ article, onDelete, canManage }: ArticleCardProps) {
  return (
    <Card interactive padding="none" className="overflow-hidden group relative h-full">
      <Link href={`/news/${article.slug}`} className="block">
        {/* Cover */}
        <div className="h-36 bg-gradient-to-br from-cranberry-100 to-cranberry-50 dark:from-cranberry-900/20 dark:to-cranberry-950/30 overflow-hidden">
          {article.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}
          {!article.isPublished && (
            <div className="absolute top-2 left-2">
              <Badge variant="gold">Draft</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={categoryColors[article.category] || 'gray'}>{article.category}</Badge>
            {article.publishedAt && (
              <span className="text-xs text-gray-400">{formatDate(article.publishedAt, { month: 'short', day: 'numeric' })}</span>
            )}
          </div>
          <h3 className="font-display font-bold text-gray-900 dark:text-white line-clamp-2">{article.title}</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{article.excerpt}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <span>By {article.author?.name || 'Unknown'}</span>
            {article.viewCount != null && <><span>·</span><span>{article.viewCount} views</span></>}
            {article.likeCount != null && <><span>·</span><span>❤️ {article.likeCount}</span></>}
          </div>
        </div>
      </Link>

      {canManage && onDelete && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(article.id); }}
            className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700 transition-colors text-xs"
            title="Delete"
          >
            🗑️
          </button>
        </div>
      )}
    </Card>
  );
}
