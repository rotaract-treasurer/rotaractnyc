import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import type { Member } from '@/types';

const roleColors: Record<string, 'cranberry' | 'gold' | 'azure' | 'gray'> = {
  president: 'cranberry',
  treasurer: 'gold',
  board: 'azure',
  member: 'gray',
};

interface MemberCardProps {
  member: Member;
  onMessage?: () => void;
  compact?: boolean;
}

export default function MemberCard({ member: m, onMessage, compact = false }: MemberCardProps) {
  return (
    <Card interactive padding="md">
      <div className="flex items-start gap-3">
        <Avatar src={m.photoURL} alt={m.displayName} size={compact ? 'md' : 'lg'} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{m.displayName}</h3>
          <Badge variant={roleColors[m.role] || 'gray'} className="mt-1">{m.role}</Badge>
          {m.committee && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{m.committee}</p>
          )}
          {m.occupation && (
            <p className="text-xs text-gray-400 mt-1">{m.occupation}{m.employer ? ` at ${m.employer}` : ''}</p>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex gap-2">
          {m.linkedIn && (
            <a href={m.linkedIn} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button size="sm" variant="ghost" className="w-full">LinkedIn</Button>
            </a>
          )}
          {onMessage && (
            <Button size="sm" variant="outline" className="flex-1" onClick={onMessage}>
              Message
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
