import type { Metadata } from 'next';
import Link from 'next/link';
import HeroSection from '@/components/public/HeroSection';
import { generateMeta } from '@/lib/seo';

export const metadata: Metadata = generateMeta({
  title: 'Donate',
  description: 'Support Rotaract NYC\'s mission by making a contribution to our service projects and community initiatives.',
  path: '/donate',
});

export default function DonatePage() {
  return (
    <>
      <HeroSection title="Support Our Mission" subtitle="Your contribution helps us create lasting change in communities locally and around the world." size="sm" />

      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-page max-w-3xl text-center">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-10">
            <div className="text-5xl mb-4">💛</div>
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Every Dollar Makes a Difference
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              Donations to Rotaract NYC support our community service projects, including food bank drives, park cleanups, educational programs, and international service initiatives. 100% of donations go directly to our project funds.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[25, 50, 100].map((amount) => (
                <div key={amount} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-cranberry transition-colors cursor-pointer">
                  <p className="text-2xl font-display font-bold text-cranberry">${amount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {amount === 25 ? 'Supplies for a service day' : amount === 50 ? 'Meals for 10 families' : 'Full project sponsorship'}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              To make a donation, please contact us directly or visit us at a meeting.
            </p>
            <Link href="/contact" className="btn-lg btn-primary">
              Contact Us to Donate
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
