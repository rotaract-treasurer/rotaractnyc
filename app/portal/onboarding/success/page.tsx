'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OnboardingSuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/portal');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="text-green-500 text-6xl mb-6">✓</div>
        
        <h1 className="text-3xl font-bold mb-4">Welcome to Rotaract NYC!</h1>
        
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Your membership is now active
        </p>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
          <p className="text-green-800 dark:text-green-200 mb-4">
            ✓ Profile completed<br />
            ✓ Payment received<br />
            ✓ Confirmation email sent
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            You now have full access to the member portal!
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-lg">What's Next?</h3>
          <ul className="text-left space-y-2 max-w-md mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">→</span>
              <span>Browse the member directory</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">→</span>
              <span>RSVP to upcoming events</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">→</span>
              <span>Access club documents and resources</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">→</span>
              <span>Connect with fellow members</span>
            </li>
          </ul>
        </div>

        <Link
          href="/portal"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
        >
          Go to Member Portal
        </Link>

        <p className="mt-6 text-sm text-gray-500">
          Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
        </p>
      </div>
    </div>
  );
}
