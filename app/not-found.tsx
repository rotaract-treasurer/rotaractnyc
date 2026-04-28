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
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 px-6 py-2.5 text-sm bg-cranberry text-white hover:bg-cranberry-800 focus-visible:ring-cranberry-500 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
