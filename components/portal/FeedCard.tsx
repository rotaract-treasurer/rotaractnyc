'use client';

import Image from 'next/image';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { formatRelativeTime } from '@/lib/utils/format';
import type { CommunityPost } from '@/types';

interface FeedCardProps {
  post: CommunityPost;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
}

export default function FeedCard({ post, onLike, onComment }: FeedCardProps) {
  return (
    <Card padding="md">
      <div className="flex items-start gap-3">
        <Avatar src={post.authorPhoto} alt={post.authorName || 'Member'} size="md" />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{post.authorName}</p>
            {post.type === 'announcement' && <Badge variant="cranberry">Announcement</Badge>}
            {post.type === 'spotlight' && <Badge variant="gold">Spotlight</Badge>}
            <span className="text-xs text-gray-400">{formatRelativeTime(post.createdAt)}</span>
          </div>

          {/* Content */}
          <p className="mt-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Images */}
          {post.imageURLs && post.imageURLs.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {post.imageURLs.map((url, i) => (
                <Image key={i} src={url} alt="" className="rounded-xl object-cover w-full h-48" width={400} height={192} />
              ))}
            </div>
          )}

          {/* Link */}
          {post.linkURL && (
            <a
              href={post.linkURL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm text-cranberry hover:underline"
            >
              🔗 {post.linkURL}
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => onLike?.(post.id)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              ❤️ {post.likeCount || 0}
            </button>
            <button
              onClick={() => onComment?.(post.id)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-cranberry transition-colors"
            >
              💬 {post.commentCount || 0}
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}
