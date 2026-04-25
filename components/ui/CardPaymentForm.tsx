'use client';

import { useState, FormEvent } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface CardPaymentFormProps {
  amount: string;
  onSuccess: () => void;
  onBack: () => void;
  submitLabel?: string;
  accentClass?: string;
}

export default function CardPaymentForm({
  amount,
  onSuccess,
  onBack,
  submitLabel,
  accentClass = 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-600',
}: CardPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError('');

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Fallback URL if the payment method requires a browser redirect (e.g. bank auth).
        // Stripe appends ?payment_intent=...&redirect_status=succeeded on return.
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.');
      setProcessing(false);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess();
    } else {
      setError('Unexpected payment status. Please try again or contact support.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="submit"
          disabled={!stripe || !elements || processing}
          className={`flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${accentClass}`}
        >
          {processing ? (
            <span className="inline-flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing…
            </span>
          ) : (
            submitLabel ?? `Pay ${amount}`
          )}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          ← Back
        </button>
      </div>
    </form>
  );
}
