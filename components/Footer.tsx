import Link from 'next/link'
import { FaFacebook, FaLinkedin, FaInstagram } from 'react-icons/fa'
import { DEFAULT_SETTINGS } from '@/lib/content/settings'
import { getFirebaseAdminDb, isFirebaseAdminConfigured } from '@/lib/firebase/admin'

async function getSettings() {
  if (!isFirebaseAdminConfigured()) return DEFAULT_SETTINGS

  try {
    const doc = await getFirebaseAdminDb().collection('settings').doc('site').get()
    if (!doc.exists) return DEFAULT_SETTINGS

    const data: unknown = doc.data()
    const obj = typeof data === 'object' && data ? (data as Record<string, unknown>) : {}

    const addressLinesRaw = obj.addressLines
    const addressLines = Array.isArray(addressLinesRaw)
      ? addressLinesRaw.map((x) => String(x)).filter(Boolean)
      : DEFAULT_SETTINGS.addressLines

    return {
      contactEmail: String(obj.contactEmail ?? DEFAULT_SETTINGS.contactEmail),
      addressLines,
      facebookUrl: String(obj.facebookUrl ?? DEFAULT_SETTINGS.facebookUrl),
      instagramUrl: String(obj.instagramUrl ?? DEFAULT_SETTINGS.instagramUrl),
      linkedinUrl: String(obj.linkedinUrl ?? DEFAULT_SETTINGS.linkedinUrl),
      meetingLabel: String(obj.meetingLabel ?? DEFAULT_SETTINGS.meetingLabel),
      meetingTime: String(obj.meetingTime ?? DEFAULT_SETTINGS.meetingTime),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

const Footer = async () => {
  const settings = await getSettings()

  return (
    <footer className="bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark">
      <div className="container-main py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary dark:text-primary-400">About Us</h3>
            <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">
              Rotaract Club of New York at the United Nations - Building leadership
              through service and fellowship.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary dark:text-primary-400">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/mission" className="text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-400 transition-colors">
                  Mission
                </Link>
              </li>
              <li>
                <Link href="/membership-requirements" className="text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-400 transition-colors">
                  Membership
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-400 transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-400 transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary dark:text-primary-400">Contact</h3>
            <ul className="space-y-2 text-text-secondary dark:text-text-secondary-dark">
              {settings.addressLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
              <li>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="hover:text-primary dark:hover:text-primary-400 transition-colors"
                >
                  {settings.contactEmail}
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-primary dark:text-primary-400">Follow Us</h3>
            <div className="flex space-x-4">
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Facebook"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-light dark:border-border-dark text-2xl text-text-secondary dark:text-text-secondary-dark hover:border-primary/30 hover:text-primary dark:hover:text-primary-400 transition-colors"
              >
                <FaFacebook aria-hidden="true" />
              </a>
              <a
                href={settings.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect with us on LinkedIn"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-light dark:border-border-dark text-2xl text-text-secondary dark:text-text-secondary-dark hover:border-primary/30 hover:text-primary dark:hover:text-primary-400 transition-colors"
              >
                <FaLinkedin aria-hidden="true" />
              </a>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow us on Instagram"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-light dark:border-border-dark text-2xl text-text-secondary dark:text-text-secondary-dark hover:border-primary/30 hover:text-primary dark:hover:text-primary-400 transition-colors"
              >
                <FaInstagram aria-hidden="true" />
              </a>
            </div>
            <div className="mt-6">
              <p className="text-sm text-text-muted dark:text-text-muted-dark">
                {settings.meetingLabel}<br />
                <span className="text-primary dark:text-primary-400 font-semibold">{settings.meetingTime}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-border-light dark:border-border-dark mt-10 pt-8 text-center text-text-muted dark:text-text-muted-dark">
          <p>&copy; {new Date().getFullYear()} Rotaract Club at the United Nations. All rights reserved.</p>
          <p className="mt-2 text-text-muted dark:text-text-muted-dark">
            Sponsored by{' '}
            <a
              href="https://www.nyrotary.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-text-secondary dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary-400 transition-colors"
            >
              The Rotary Club of New York
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
