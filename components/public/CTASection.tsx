import Link from 'next/link';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

interface CTASectionProps {
  headline: string;
  description: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  variant?: 'cranberry' | 'gold' | 'light';
  className?: string;
}

export default function CTASection({
  headline,
  description,
  primaryAction,
  secondaryAction,
  variant = 'cranberry',
  className,
}: CTASectionProps) {
  const bg =
    variant === 'cranberry'
      ? 'bg-cranberry text-white'
      : variant === 'gold'
        ? 'bg-gold-50 dark:bg-gold-900/20 text-gray-900 dark:text-white'
        : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white';

  return (
    <section className={cn('py-16 px-6', bg, className)}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className={cn('text-3xl md:text-4xl font-display font-bold', variant === 'cranberry' && 'text-white')}>
          {headline}
        </h2>
        <p className={cn('mt-4 text-lg leading-relaxed', variant === 'cranberry' ? 'text-white/80' : 'text-gray-600 dark:text-gray-400')}>
          {description}
        </p>
        <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
          <Link href={primaryAction.href}>
            <Button
              size="lg"
              variant={variant === 'cranberry' ? 'gold' : 'primary'}
            >
              {primaryAction.label}
            </Button>
          </Link>
          {secondaryAction && (
            <Link href={secondaryAction.href}>
              <Button
                size="lg"
                variant={variant === 'cranberry' ? 'outline' : 'secondary'}
                className={variant === 'cranberry' ? 'border-white text-white hover:bg-white hover:text-cranberry' : ''}
              >
                {secondaryAction.label}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
