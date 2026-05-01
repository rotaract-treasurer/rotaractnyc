import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import type { Member } from '@/types';

const roleColors: Record<string, 'cranberry' | 'gold' | 'azure' | 'gray'> = {
  president: 'cranberry',
  treasurer: 'gold',
  board: 'azure',
  member: 'gray',
};

/** Human-readable role label, preferring boardTitle for board members. */
function roleLabel(m: Member): string {
  if (m.boardTitle) return m.boardTitle;
  const map: Record<string, string> = {
    president: 'President',
    treasurer: 'Treasurer',
    board: 'Board',
    member: 'Member',
  };
  return map[m.role] ?? m.role;
}

interface MemberCardProps {
  member: Member;
  viewerRole?: string;
  onMessage?: () => void;
  /** compact = inline row layout (used inside table rows or sidebars) */
  compact?: boolean;
}

export default function MemberCard({ member: m, viewerRole, onMessage, compact = false }: MemberCardProps) {
  const router = useRouter();
  const isBoard = ['president', 'board', 'treasurer'].includes(viewerRole || '');
  const whatsAppNumber = m.whatsAppSameAsPhone ? m.phone : m.whatsAppPhone;
  const whatsAppLink = whatsAppNumber ? `https://wa.me/${whatsAppNumber.replace(/\D/g, '')}` : null;

  const initials = String(m.displayName ?? '')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── Compact layout (sidebars, widget use) ─────────────────────────────────
  if (compact) {
    return (
      <div
        className="group flex items-start gap-3 p-3 rounded-xl border border-gray-200/60 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-cranberry-200 dark:hover:border-cranberry-800 hover:shadow-sm transition-all cursor-pointer"
        onClick={() => router.push(`/portal/directory/${m.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && router.push(`/portal/directory/${m.id}`)}
      >
        <div className="relative shrink-0">
          {m.photoURL ? (
            <img src={m.photoURL} alt={m.displayName} className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-cranberry-100 dark:bg-cranberry-900/40 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
              <span className="text-sm font-bold text-cranberry-700 dark:text-cranberry-300">{initials}</span>
            </div>
          )}
          {m.role !== 'member' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm">
              <div className={`w-2.5 h-2.5 rounded-full ${
                m.role === 'president' ? 'bg-cranberry' : m.role === 'treasurer' ? 'bg-gold' : 'bg-azure'
              }`} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-white truncate group-hover:text-cranberry transition-colors">{m.displayName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{roleLabel(m)}{m.committee ? ` · ${m.committee}` : ''}</p>
        </div>
      </div>
    );
  }

  // ── Full magazine-style grid card ───────────────────────────────────────
  return (
    <div
      className="group bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200/60 dark:border-gray-800 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-cranberry-900/5 hover:-translate-y-0.5"
      onClick={() => router.push(`/portal/directory/${m.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && router.push(`/portal/directory/${m.id}`)}
    >
      {/* Photo / avatar hero */}
      <div className="h-56 overflow-hidden bg-cranberry-50 dark:bg-cranberry-950/20 relative">
        {m.photoURL ? (
          <img
            src={m.photoURL}
            alt={m.displayName}
            className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-cranberry-100 dark:bg-cranberry-900/40 flex items-center justify-center">
              <span className="text-2xl font-bold text-cranberry-700 dark:text-cranberry-300 select-none">
                {initials}
              </span>
            </div>
          </div>
        )}
        {/* Role badge overlay (board/officer roles) */}
        {m.role !== 'member' && (
          <div className="absolute top-2 right-2">
            <Badge variant={roleColors[m.role] || 'gray'}>{roleLabel(m)}</Badge>
          </div>
        )}
        {m.status === 'alumni' && (
          <div className="absolute top-2 left-2">
            <Badge variant="gold">Alumni</Badge>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white group-hover:text-cranberry dark:group-hover:text-cranberry-400 transition-colors leading-tight">
            {m.displayName}
          </h3>
          {m.role === 'member' && (
            <p className="text-xs font-semibold uppercase tracking-wider text-gold-600 dark:text-gold-400 mt-0.5">Member</p>
          )}
          {m.committee && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{m.committee}</p>
          )}
          {m.occupation && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {m.occupation}{m.employer ? ` · ${m.employer}` : ''}
            </p>
          )}
        </div>

        {/* Action row — stop propagation so card click doesn’t also fire these */}
        <div
          className="flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {onMessage && (
            <button
              onClick={onMessage}
              className="w-8 h-8 rounded-full flex items-center justify-center text-cranberry hover:bg-cranberry-50 dark:hover:bg-cranberry-900/20 transition-colors"
              title="Send message"
            >
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          {m.linkedIn && (
            <a
              href={m.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center text-cranberry hover:bg-cranberry-50 dark:hover:bg-cranberry-900/20 transition-colors"
              title="LinkedIn"
            >
              <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          )}
          {isBoard && whatsAppLink && (
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full flex items-center justify-center text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              title="WhatsApp"
            >
              <svg aria-hidden="true" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.917.918l4.458-1.495A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.37 0-4.567-.818-6.3-2.187l-.44-.358-3.095 1.037 1.037-3.095-.358-.44A9.95 9.95 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
              </svg>
            </a>
          )}
          <a
            href={`/portal/directory/${m.id}`}
            className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-cranberry hover:bg-cranberry-50 dark:hover:bg-cranberry-900/20 transition-colors"
            title="View profile"
            onClick={(e) => e.stopPropagation()}
          >
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
