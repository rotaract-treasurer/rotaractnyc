import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-gray-950">
      <div className="text-center max-w-md">
        <p className="text-7xl font-display font-bold text-cranberry mb-4">404</p>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">Page not found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="btn-md btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
