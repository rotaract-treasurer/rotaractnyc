'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { FaEnvelope, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaTwitter } from 'react-icons/fa'
import { useState } from 'react'

export default function ContactPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [newsletterEmail, setNewsletterEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const form = new FormData(e.currentTarget)
    const topic = String(form.get('topic') || '')
    const subject = String(form.get('subject') || '')

    const payload = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      subject: subject || topic || 'Contact Form',
      message: String(form.get('message') || ''),
    }

    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        setError('Unable to send your message. Please try again.')
        return
      }

      e.currentTarget.reset()
      setSuccess(true)
    } catch {
      setError('Unable to send your message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const email = newsletterEmail.trim()
    const target = email ? `/newsletter-sign-up?email=${encodeURIComponent(email)}` : '/newsletter-sign-up'
    router.push(target)
  }

  return (
    <div className="bg-white">
      {/* Intro */}
      <section className="relative overflow-hidden pt-14 pb-10">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-56 -left-56 h-[640px] w-[640px] rounded-full bg-primary/10 blur-3xl" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary tracking-tight">Contact</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-700">
              Reach out about membership, volunteering, partnerships, or upcoming events.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Social bento */}
      <section className="pb-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.a
              href="http://instagram.com/rotaractnyc"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl p-8 h-64 md:h-72 bg-gradient-to-br from-primary to-primary-800 text-white shadow-soft hover:shadow-soft-hover transition-all"
            >
              <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between">
                <div className="bg-white/15 border border-white/20 rounded-xl p-3">
                  <FaInstagram className="text-3xl" />
                </div>
                <span className="text-white/70 group-hover:text-white transition-colors text-sm font-semibold">Open</span>
              </div>
              <div className="relative mt-10">
                <div className="text-3xl font-extrabold tracking-tight">Instagram</div>
                <div className="mt-1 text-white/90 font-medium">See photos & stories</div>
                <div className="mt-1 text-white/70 text-sm">@rotaractnyc</div>
              </div>
            </motion.a>

            <motion.a
              href="https://www.linkedin.com/company/rotaract-at-the-un-nyc/"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="group relative overflow-hidden rounded-2xl p-8 h-64 md:h-72 bg-primary text-white shadow-soft hover:shadow-soft-hover transition-all"
            >
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
              <div className="relative flex items-start justify-between">
                <div className="bg-white/15 border border-white/20 rounded-xl p-3">
                  <FaLinkedin className="text-3xl" />
                </div>
                <span className="text-white/70 group-hover:text-white transition-colors text-sm font-semibold">Open</span>
              </div>
              <div className="relative mt-10">
                <div className="text-3xl font-extrabold tracking-tight">LinkedIn</div>
                <div className="mt-1 text-white/90 font-medium">Connect professionally</div>
                <div className="mt-1 text-white/70 text-sm">Rotaract at the UN (NYC)</div>
              </div>
            </motion.a>

            <motion.a
              href="/follow-us"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative overflow-hidden rounded-2xl p-8 h-64 md:h-72 bg-primary-800 text-white shadow-soft hover:shadow-soft-hover transition-all"
            >
              <div className="absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-white/10" />
              <div className="relative flex items-start justify-between">
                <div className="bg-white/15 border border-white/20 rounded-xl p-3">
                  <FaTwitter className="text-3xl" />
                </div>
                <span className="text-white/70 group-hover:text-white transition-colors text-sm font-semibold">Explore</span>
              </div>
              <div className="relative mt-10">
                <div className="text-xs uppercase tracking-widest text-white/70">More</div>
                <div className="mt-1 text-2xl font-extrabold tracking-tight">Follow Us</div>
                <div className="mt-1 text-white/80 text-sm">All social links in one place</div>
              </div>
            </motion.a>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl bg-gray-50 border border-gray-100 shadow-soft p-8 md:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-2xl" />
            <div className="relative max-w-2xl mx-auto">
              <div className="w-12 h-12 bg-primary/10 border border-primary/15 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
                <FaEnvelope className="text-xl" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">Stay Connected</h2>
              <p className="text-gray-700 mt-3 text-lg">
                Get updates on volunteering, socials, and guest speakers.
              </p>

              <form onSubmit={handleNewsletterSubmit} className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 max-w-md w-full px-5 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap"
                >
                  Join Newsletter
                </button>
              </form>

              <p className="text-xs text-gray-500 mt-3">We respect your privacy. Unsubscribe at any time.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact + map split */}
      <section className="pt-10 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-soft">
            {/* Form */}
            <div className="p-8 md:p-12 flex flex-col justify-center gap-8">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-2">Get in Touch</h2>
                <p className="text-gray-700">Have a question about membership or volunteering? Send us a message.</p>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                  We typically respond within 24-48 hours
                </p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                {error ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">error</span>
                    {error}
                  </div>
                ) : null}

                {success ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Message sent successfully! We'll be in touch soon.
                  </div>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-semibold text-gray-700 ml-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Jane Doe"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="jane@example.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="topic" className="text-sm font-semibold text-gray-700 ml-1">
                    Topic
                  </label>
                  <select
                    id="topic"
                    name="topic"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    defaultValue="Membership Inquiry"
                  >
                    <option>Membership Inquiry</option>
                    <option>Volunteering Opportunities</option>
                    <option>Guest Speaker Proposal</option>
                    <option>Partnerships</option>
                    <option>Other</option>
                  </select>
                  <p className="text-xs text-gray-500 ml-1">Select the topic that best describes your inquiry</p>
                </div>

                {/* Keep subject field for compatibility, but hide it from the UI */}
                <input type="hidden" name="subject" value="" />

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-sm font-semibold text-gray-700 ml-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="How can we help you? Please include any relevant details..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full bg-primary text-white font-semibold rounded-xl py-3.5 hover:bg-primary-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Sending…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Map */}
            <div className="relative min-h-[420px] w-full bg-gray-200 overflow-hidden">
              <div
                className="absolute inset-0 bg-cover bg-center grayscale opacity-80"
                style={{ backgroundImage: "url('/ce9ea973f79cb6988ad3e2945e3a87ae.jpg')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent lg:bg-gradient-to-l lg:from-gray-900/60 lg:to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-12 lg:right-12">
                <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0 text-primary">
                      <FaMapMarkerAlt />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Weekly Meetings</h4>
                      <p className="text-gray-700 mt-1 text-sm leading-relaxed">
                        216 East 45th Street<br />
                        New York, NY 10017<br />
                        Every 2nd &amp; 4th Thursday, 7:00–9:00 PM EST
                      </p>
                      <a
                        className="inline-flex items-center gap-1 text-primary text-xs font-semibold mt-3 hover:text-primary-600 transition-colors"
                        href="https://www.google.com/maps/search/?api=1&query=216+East+45th+Street,+New+York,+NY+10017"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Get Directions <span aria-hidden>→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
