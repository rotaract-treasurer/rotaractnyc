import type { Metadata } from 'next';
import HeroSection from '@/components/public/HeroSection';
import { generateMeta } from '@/lib/seo';

export const metadata: Metadata = generateMeta({
  title: 'Gallery',
  description: 'Browse photos from Rotaract NYC events, service projects, and fellowship activities.',
  path: '/gallery',
});

const placeholderImages = [
  { id: 1, label: 'Spring Service Day', gradient: 'from-cranberry-400 to-cranberry-600' },
  { id: 2, label: 'Annual Gala', gradient: 'from-gold-400 to-gold-600' },
  { id: 3, label: 'UN Visit', gradient: 'from-azure-400 to-azure-600' },
  { id: 4, label: 'Holiday Fundraiser', gradient: 'from-emerald-400 to-emerald-600' },
  { id: 5, label: 'Networking Mixer', gradient: 'from-purple-400 to-purple-600' },
  { id: 6, label: 'Community Cleanup', gradient: 'from-cranberry-400 to-cranberry-600' },
  { id: 7, label: 'Board Meeting', gradient: 'from-azure-400 to-azure-600' },
  { id: 8, label: 'Fellowship Night', gradient: 'from-gold-400 to-gold-600' },
];

export default function GalleryPage() {
  return (
    <>
      <HeroSection title="Gallery" subtitle="Moments from our events, service projects, and fellowship gatherings." size="sm" />

      <section className="section-padding bg-white dark:bg-gray-950">
        <div className="container-page">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {placeholderImages.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${img.gradient}`} />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end p-4">
                  <p className="text-white font-semibold text-sm opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    {img.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Members can view the full gallery with high-resolution photos in the member portal.
            </p>
            <a href="/portal/login" className="btn-sm btn-outline">
              Member Login
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
