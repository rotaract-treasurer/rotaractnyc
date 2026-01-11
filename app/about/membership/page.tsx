'use client'

import { motion } from 'framer-motion'
import { FaCheckCircle } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { DEFAULT_PAGES, type EmphasisText, type MembershipData } from '@/lib/content/pages'

function coerceMembershipData(input: unknown, fallback: MembershipData): MembershipData {
  const obj = typeof input === 'object' && input ? (input as Record<string, unknown>) : {}

  const benefitsRaw = obj.benefits
  const benefits = Array.isArray(benefitsRaw)
    ? benefitsRaw.map((b) => String(b ?? '')).filter(Boolean)
    : fallback.benefits

  const membershipFormUrl = String(obj.membershipFormUrl ?? fallback.membershipFormUrl)

  const eligibilityIntro = String(obj.eligibilityIntro ?? fallback.eligibilityIntro)

  const reqsRaw = obj.eligibilityRequirements
  const eligibilityRequirements: EmphasisText[] = Array.isArray(reqsRaw)
    ? reqsRaw
        .map((r) => {
          const rr = typeof r === 'object' && r ? (r as Record<string, unknown>) : {}
          return {
            prefix: String(rr.prefix ?? ''),
            strong: String(rr.strong ?? ''),
            suffix: rr.suffix === undefined ? undefined : String(rr.suffix ?? ''),
          }
        })
        .filter((r) => r.strong)
    : fallback.eligibilityRequirements

  const duesIntro = String(obj.duesIntro ?? fallback.duesIntro)

  const typesRaw = obj.membershipTypes
  const membershipTypes = Array.isArray(typesRaw)
    ? typesRaw.map((t) => String(t ?? '')).filter(Boolean)
    : fallback.membershipTypes

  const duesOutro = String(obj.duesOutro ?? fallback.duesOutro)
  const treasurerEmail = String(obj.treasurerEmail ?? fallback.treasurerEmail)

  const pm = typeof obj.paymentMethods === 'object' && obj.paymentMethods ? (obj.paymentMethods as Record<string, unknown>) : {}
  const paymentMethods = {
    venmoLabel: String(pm.venmoLabel ?? fallback.paymentMethods.venmoLabel),
    venmoHandle: String(pm.venmoHandle ?? fallback.paymentMethods.venmoHandle),
  }

  return {
    benefits,
    membershipFormUrl,
    eligibilityIntro,
    eligibilityRequirements,
    duesIntro,
    membershipTypes,
    duesOutro,
    treasurerEmail,
    paymentMethods,
  }
}

export default function MembershipPage() {
  const defaults = DEFAULT_PAGES.membership
  const fallbackData = defaults.data as MembershipData
  const [heroTitle, setHeroTitle] = useState(defaults.heroTitle)
  const [heroSubtitle, setHeroSubtitle] = useState(defaults.heroSubtitle)
  const [data, setData] = useState<MembershipData>(fallbackData)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [membershipType, setMembershipType] = useState('')
  const [location, setLocation] = useState('')
  const [occupationOrSchool, setOccupationOrSchool] = useState('')
  const [interests, setInterests] = useState('')
  const [whyJoin, setWhyJoin] = useState('')
  const [hearAboutUs, setHearAboutUs] = useState('')
  const [company, setCompany] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccessId, setSubmitSuccessId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const res = await fetch('/api/public/pages/membership')
        if (!res.ok) return

        const json: unknown = await res.json()
        const page =
          typeof json === 'object' &&
          json &&
          typeof (json as { page?: unknown }).page === 'object' &&
          (json as { page?: unknown }).page
            ? ((json as { page: unknown }).page as Record<string, unknown>)
            : null

        if (!page || cancelled) return

        setHeroTitle(String(page.heroTitle ?? defaults.heroTitle))
        setHeroSubtitle(String(page.heroSubtitle ?? defaults.heroSubtitle))

        const nextData = coerceMembershipData(page.data, fallbackData)
        setData(nextData)
      } catch {
        // keep defaults
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [defaults.heroSubtitle, defaults.heroTitle, fallbackData])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitSuccessId(null)

    const safeName = fullName.trim()
    const safeEmail = email.trim()

    if (!safeName || !safeEmail) {
      setSubmitError('Please provide your name and email.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/public/membership', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: safeName,
          email: safeEmail,
          phone,
          membershipType,
          location,
          occupationOrSchool,
          interests,
          whyJoin,
          hearAboutUs,
          company,
        }),
      })

      const json: unknown = await res.json().catch(() => null)
      const error =
        typeof json === 'object' &&
        json &&
        'error' in json &&
        typeof (json as { error?: unknown }).error === 'string'
          ? (json as { error: string }).error
          : null

      if (!res.ok) {
        setSubmitError(error || 'Something went wrong. Please try again.')
        return
      }

      const id =
        typeof json === 'object' &&
        json &&
        'id' in json &&
        typeof (json as { id?: unknown }).id === 'string'
          ? (json as { id: string }).id
          : null

      setSubmitSuccessId(id || 'ok')
      setFullName('')
      setEmail('')
      setPhone('')
      setMembershipType('')
      setLocation('')
      setOccupationOrSchool('')
      setInterests('')
      setWhyJoin('')
      setHearAboutUs('')
      setCompany('')
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-14 overflow-hidden bg-white">
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-rotaract-pink/10 blur-3xl" />
        <div className="absolute -bottom-56 -left-56 h-[640px] w-[640px] rounded-full bg-rotaract-darkpink/10 blur-3xl" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-rotaract-darkpink tracking-tight">{heroTitle}</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-700">{heroSubtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-rotaract-darkpink text-center">Membership Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {data.benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-4"
              >
                <FaCheckCircle className="text-rotaract-pink text-2xl flex-shrink-0 mt-1" />
                <p className="text-lg text-gray-700">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Joining Our Club */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-rotaract-darkpink text-center">Joining Our Club</h2>
            <div className="bg-white p-8 rounded-lg shadow-md mb-8">
              <p className="text-lg text-gray-700 mb-6">
                Interested in joining? Fill out the form below and we’ll follow up with next steps.
              </p>

              {submitError ? (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                  {submitError}
                </div>
              ) : null}

              {submitSuccessId ? (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800">
                  Thanks — your application has been received.
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="space-y-5">
                {/* Honeypot */}
                <div className="hidden">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="company">
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="fullName">
                      Full name <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rotaract-pink"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                      Email <span className="text-red-600">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rotaract-pink"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="phone">
                      Phone (optional)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rotaract-pink"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="membershipType">
                      Membership type (optional)
                    </label>
                    <select
                      id="membershipType"
                      name="membershipType"
                      value={membershipType}
                      onChange={(e) => setMembershipType(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-rotaract-pink"
                    >
                      <option value="">Select…</option>
                      {data.membershipTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="location">
                      Location (optional)
                    </label>
                    <input
                      id="location"
                      name="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rotaract-pink"
                      placeholder="e.g., Manhattan, Brooklyn, Queens"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700" htmlFor="occupationOrSchool">
                      Occupation / School (optional)
                    </label>
                    <input
                      id="occupationOrSchool"
                      name="occupationOrSchool"
                      value={occupationOrSchool}
                      onChange={(e) => setOccupationOrSchool(e.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rotaract-pink"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="interests">
                    Interests (optional)
                  </label>
                  <textarea
                    id="interests"
                    name="interests"
                    rows={3}
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rotaract-pink"
                    placeholder="Service areas, causes you care about, professional interests…"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="whyJoin">
                    Why do you want to join? (optional)
                  </label>
                  <textarea
                    id="whyJoin"
                    name="whyJoin"
                    rows={3}
                    value={whyJoin}
                    onChange={(e) => setWhyJoin(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rotaract-pink"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor="hearAboutUs">
                    How did you hear about us? (optional)
                  </label>
                  <input
                    id="hearAboutUs"
                    name="hearAboutUs"
                    value={hearAboutUs}
                    onChange={(e) => setHearAboutUs(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rotaract-pink"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-block bg-rotaract-pink text-white font-semibold px-8 py-3 rounded-full hover:bg-rotaract-darkpink transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements for Membership Eligibility */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-rotaract-darkpink text-center">Requirements for Membership Eligibility</h2>
            <div className="bg-gray-50 p-8 rounded-lg shadow-md">
              <p className="text-lg text-gray-700 mb-6">
                {data.eligibilityIntro}
              </p>
              <ul className="space-y-4 text-lg text-gray-700">
                {data.eligibilityRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start">
                    <FaCheckCircle className="text-rotaract-pink text-xl mr-3 mt-1 flex-shrink-0" />
                    <span>
                      {req.prefix}
                      <strong>{req.strong}</strong>
                      {req.suffix || ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Dues */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-rotaract-darkpink text-center">Membership Dues</h2>
            <div className="bg-white p-8 rounded-lg shadow-md">
              <p className="text-lg text-gray-700 mb-6">
                {data.duesIntro}
              </p>
              
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 text-rotaract-darkpink">We have different types of membership:</h3>
                <ul className="space-y-3 text-lg text-gray-700 ml-6">
                  {data.membershipTypes.map((t, idx) => (
                    <li key={idx} className="list-disc">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-gray-700 mb-8">
                {data.duesOutro}
              </p>

              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4 text-rotaract-darkpink">Looking to pay your dues?</h3>
                <p className="text-gray-700 mb-4">Our preferred methods of payments are listed below:</p>
                
                <div className="bg-gray-50 p-6 rounded-lg mb-4">
                  <p className="text-lg font-semibold text-rotaract-darkpink mb-2">{data.paymentMethods.venmoLabel}</p>
                  <p className="text-gray-700">{data.paymentMethods.venmoHandle}</p>
                </div>

                <p className="text-gray-600 text-sm">
                  If you have any questions about paying dues please email{' '}
                  <a 
                    href={`mailto:${data.treasurerEmail}`}
                    className="text-rotaract-pink hover:text-rotaract-darkpink font-semibold"
                  >
                    {data.treasurerEmail}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
