import { cn } from '@/lib/utils/cn';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'py-20 sm:py-24',
  md: 'py-24 sm:py-32',
  lg: 'py-32 sm:py-40',
};

export default function HeroSection({ title, subtitle, children, className, size = 'md' }: HeroSectionProps) {
  return (
    <section
      className={cn(
        'relative bg-gradient-to-br from-cranberry-900 via-cranberry to-cranberry-800 text-white overflow-hidden',
        sizes[size],
        className
      )}
    >
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-[0.07]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      <div className="container-page relative z-10 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight animate-fade-in">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg sm:text-xl text-cranberry-200 max-w-2xl mx-auto animate-fade-in animation-delay-200">
            {subtitle}
          </p>
        )}
        {children && <div className="mt-8 animate-fade-in animation-delay-400">{children}</div>}
      </div>
    </section>
  );
}
