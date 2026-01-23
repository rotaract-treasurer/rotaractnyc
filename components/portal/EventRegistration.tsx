'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EventRegistrationProps {
  event: {
    id: string
    title: string
    eventType: 'free' | 'paid' | 'service' | 'hybrid'
    imageUrl?: string
    capacity?: number
    attendeeCount?: number
    allowGuests: boolean
    memberPrice?: number
    memberEarlyBirdPrice?: number
    earlyBirdDeadline?: string
    guestPrice?: number
    guestEarlyBirdPrice?: number
    serviceHours?: number
    requiresRegistration: boolean
  }
  userStatus: 'active' | 'inactive' | 'alumni' | 'pending' | null
  hasRegistered: boolean
}

export default function EventRegistration({ event, userStatus, hasRegistered }: EventRegistrationProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState(0)

  const isMember = userStatus === 'active'
  const isFull = event.capacity && event.attendeeCount ? event.attendeeCount >= event.capacity : false

  // Check if early bird pricing is active
  const now = new Date()
  const isEarlyBird = event.earlyBirdDeadline && new Date(event.earlyBirdDeadline) > now

  // Calculate pricing
  const getMemberPrice = () => {
    if (!isMember) return null
    if (isEarlyBird && event.memberEarlyBirdPrice !== undefined) {
      return event.memberEarlyBirdPrice
    }
    return event.memberPrice || 0
  }

  const getGuestPrice = () => {
    if (isEarlyBird && event.guestEarlyBirdPrice !== undefined) {
      return event.guestEarlyBirdPrice
    }
    return event.guestPrice || 0
  }

  const memberPrice = getMemberPrice()
  const guestPrice = getGuestPrice()
  const totalPrice = (memberPrice || 0) + (guestPrice * guestCount)

  const handleFreeRSVP = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          guestCount,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to RSVP')
      }

      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePaidCheckout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/events/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          ticketType: isMember ? 'member' : 'guest',
          quantity: 1,
          guestCount,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create checkout')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout')
      setIsLoading(false)
    }
  }

  if (!event.requiresRegistration) {
    return (
      <div className="p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-400 text-2xl">info</span>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">No Registration Required</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Just show up! This event doesn't require advance registration.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (hasRegistered) {
    return (
      <div className="p-6 rounded-2xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">check_circle</span>
          <div>
            <p className="font-bold text-green-900 dark:text-green-100">You're Registered!</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              See you at the event!
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isFull) {
    return (
      <div className="p-6 rounded-2xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">event_busy</span>
          <div>
            <p className="font-bold text-red-900 dark:text-red-100">Event Full</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              This event has reached capacity.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isMember && event.eventType === 'service') {
    return (
      <div className="p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-2xl">info</span>
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-100">Members Only</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Service hour tracking is only available for active members.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pricing Display */}
      <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">confirmation_number</span>
          {event.eventType === 'free' ? 'RSVP' : event.eventType === 'service' ? 'Register for Service' : 'Ticket Pricing'}
        </h3>

        {event.eventType === 'free' && (
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-primary">FREE</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">No payment required</p>
          </div>
        )}

        {event.eventType === 'service' && (
          <div className="text-center py-4">
            <p className="text-4xl font-bold text-primary">{event.serviceHours || 0} Hours</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Service hours earned</p>
          </div>
        )}

        {event.eventType === 'paid' && (
          <div className="space-y-4">
            {isMember && memberPrice !== null && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">badge</span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Member Ticket</p>
                    {isEarlyBird && event.memberEarlyBirdPrice !== undefined && (
                      <p className="text-xs text-green-600 dark:text-green-400">Early Bird Pricing!</p>
                    )}
                  </div>
                </div>
                <p className="text-2xl font-bold text-primary">${memberPrice.toFixed(2)}</p>
              </div>
            )}

            {(!isMember || !event.allowGuests) && guestPrice !== undefined && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">person</span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {isMember ? 'Guest Ticket' : 'Ticket Price'}
                    </p>
                    {isEarlyBird && event.guestEarlyBirdPrice !== undefined && (
                      <p className="text-xs text-green-600 dark:text-green-400">Early Bird Pricing!</p>
                    )}
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">${guestPrice.toFixed(2)}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guest Counter */}
      {event.allowGuests && isMember && (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <label className="block font-semibold text-slate-900 dark:text-white mb-3">
            Bringing Guests?
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setGuestCount(Math.max(0, guestCount - 1))}
              disabled={guestCount === 0}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="text-2xl font-bold text-slate-900 dark:text-white min-w-[3rem] text-center">
              {guestCount}
            </span>
            <button
              onClick={() => setGuestCount(guestCount + 1)}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
          {guestCount > 0 && event.eventType === 'paid' && guestPrice !== undefined && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
              Guest price: ${guestPrice.toFixed(2)} each × {guestCount} = ${(guestPrice * guestCount).toFixed(2)}
            </p>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Total & CTA */}
      {event.eventType === 'paid' && (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-600 dark:text-slate-400 font-semibold">Total</span>
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handlePaidCheckout}
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Processing...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">credit_card</span>
                Proceed to Payment
              </>
            )}
          </button>
          <p className="text-xs text-center text-slate-500 mt-3">
            Secure payment powered by Stripe
          </p>
        </div>
      )}

      {(event.eventType === 'free' || event.eventType === 'service') && (
        <button
          onClick={handleFreeRSVP}
          disabled={isLoading}
          className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Registering...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              {event.eventType === 'service' ? 'Sign Up to Volunteer' : 'RSVP Now'}
            </>
          )}
        </button>
      )}

      {/* Member Benefits Note */}
      {!isMember && event.eventType === 'paid' && memberPrice !== null && memberPrice < (guestPrice || 0) && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">stars</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                Save ${((guestPrice || 0) - memberPrice).toFixed(2)} as a Member!
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Active members get discounted pricing on all paid events.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
