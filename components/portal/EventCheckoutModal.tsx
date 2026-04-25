'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CardPaymentForm from '@/components/ui/CardPaymentForm';
import { formatCurrency } from '@/lib/utils/format';
import type { PaymentSettings } from '@/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const stripeAppearance = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#2563eb',
    colorBackground: '#ffffff',
    borderRadius: '8px',
    fontSizeBase: '14px',
  },
};

interface EventCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  ticketType: 'member' | 'guest';
  priceCents: number;
  paymentSettings: PaymentSettings;
  onStripeCheckout: (embedded?: boolean) => Promise<{ clientSecret?: string; url?: string } | null | void>;
  onOfflinePayment: (method: string, proofUrl?: string) => Promise<void>;
  onCheckoutComplete?: () => void;
  loading?: boolean;
}

type PaymentMethod = 'stripe' | 'zelle' | 'venmo' | 'cash' | 'check';

export default function EventCheckoutModal({
  open,
  onClose,
  eventId,
  eventTitle,
  ticketType,
  priceCents,
  paymentSettings,
  onStripeCheckout,
  onOfflinePayment,
  onCheckoutComplete,
  loading,
}: EventCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [checkoutClientSecret, setCheckoutClientSecret] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  const amount = formatCurrency(priceCents);
  const priceLabel = ticketType === 'member' ? 'Member' : 'Guest';

  // Reset state whenever the modal closes
  useEffect(() => {
    if (!open) {
      setSelectedMethod(null);
      setCheckoutClientSecret('');
      setCheckoutError('');
      setProofUrl('');
    }
  }, [open]);

  const availableMethods: { id: PaymentMethod; label: string; description: string; enabled: boolean }[] = [
    {
      id: 'stripe',
      label: '💳 Credit Card',
      description: 'Pay securely by card — stays on this page',
      enabled: true,
    },
    {
      id: 'zelle',
      label: '🏦 Zelle',
      description: paymentSettings.zelleIdentifier || 'Bank transfer',
      enabled: paymentSettings.zelleEnabled ?? true,
    },
    {
      id: 'venmo',
      label: '📱 Venmo',
      description: paymentSettings.venmoUsername ? `@${paymentSettings.venmoUsername}` : 'Mobile payment',
      enabled: paymentSettings.venmoEnabled ?? true,
    },
    {
      id: 'cash',
      label: '💵 Cash',
      description: 'Pay in person',
      enabled: true,
    },
    {
      id: 'check',
      label: '✓ Check',
      description: 'Mail or deliver check',
      enabled: true,
    },
  ];

  const handleLoadCardForm = async () => {
    setProcessing(true);
    setCheckoutError('');
    try {
      const result = await onStripeCheckout(true);
      if (!result) {
        setCheckoutError('Unable to start checkout. Please try again.');
        return;
      }
      if (result.clientSecret) {
        setCheckoutClientSecret(result.clientSecret);
        return;
      }
      // Fallback: open Stripe hosted checkout page
      if (result.url) {
        window.location.href = result.url;
        return;
      }
      setCheckoutError('Could not create checkout session. Please try again.');
    } catch {
      setCheckoutError('Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setCheckoutClientSecret('');
    setSelectedMethod(null);
    if (onCheckoutComplete) {
      onCheckoutComplete();
    } else {
      onClose();
    }
  };

  const handleOfflineSubmit = async () => {
    if (!selectedMethod || selectedMethod === 'stripe') return;
    setProcessing(true);
    try {
      await onOfflinePayment(selectedMethod, proofUrl || undefined);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const selectedMethodData = availableMethods.find((m) => m.id === selectedMethod);
  const showingPaymentForm = selectedMethod === 'stripe' && !!checkoutClientSecret;

  return (
    <Modal open={open} onClose={onClose} title={`Buy ${priceLabel} Ticket — ${amount}`}>
      <div className="space-y-4">

        {/* Price summary */}
        <Card padding="md" className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">{eventTitle}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{amount}</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{priceLabel} Ticket</div>
          </div>
        </Card>

        {/* Payment method selector — hidden once card form is open */}
        {!showingPaymentForm && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {availableMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    setCheckoutClientSecret('');
                    setCheckoutError('');
                  }}
                  disabled={!method.enabled}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    !method.enabled
                      ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                      : selectedMethod === method.id
                      ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{method.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{method.description}</div>
                    </div>
                    {method.enabled && (
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
                          selectedMethod === method.id
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Offline payment instructions */}
        {selectedMethod && selectedMethod !== 'stripe' && !showingPaymentForm && (
          <Card padding="md" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            {selectedMethod === 'zelle' && (
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white">Zelle Transfer</div>
                {paymentSettings.zelleIdentifier && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Send to:</div>
                    <div className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white break-all">
                      {paymentSettings.zelleIdentifier}
                    </div>
                  </div>
                )}
                <div className="text-gray-600 dark:text-gray-400">Amount: {amount}</div>
                <p className="text-xs text-gray-500">Include your name and &quot;Event Ticket&quot; in the memo.</p>
              </div>
            )}
            {selectedMethod === 'venmo' && (
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white">Venmo Transfer</div>
                {paymentSettings.venmoUsername && (
                  <div>
                    <div className="text-gray-600 dark:text-gray-400">Send to:</div>
                    <div className="font-mono bg-white dark:bg-gray-800 px-2 py-1 rounded text-gray-900 dark:text-white">
                      @{paymentSettings.venmoUsername}
                    </div>
                  </div>
                )}
                <div className="text-gray-600 dark:text-gray-400">Amount: {amount}</div>
                <p className="text-xs text-gray-500">Note &quot;Event Ticket&quot; in your Venmo memo.</p>
              </div>
            )}
            {selectedMethod === 'cash' && (
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white">Cash Payment</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Pay {amount} in cash at the event or during a club meeting.
                </div>
                <p className="text-xs text-gray-500">Our treasurer will mark your ticket as paid on receipt.</p>
              </div>
            )}
            {selectedMethod === 'check' && (
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white">Check Payment</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Mail a check for {amount} payable to &quot;Rotaract NYC&quot; with memo &quot;Event Ticket&quot;.
                </div>
                <p className="text-xs text-gray-500">Contact the treasurer for the mailing address.</p>
              </div>
            )}
          </Card>
        )}

        {/* Error message (before form loads) */}
        {checkoutError && !showingPaymentForm && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">{checkoutError}</p>
        )}

        {/* Stripe card payment form */}
        {showingPaymentForm && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: checkoutClientSecret, appearance: stripeAppearance }}
          >
            <CardPaymentForm
              amount={amount}
              onSuccess={handlePaymentSuccess}
              onBack={() => {
                setCheckoutClientSecret('');
                setCheckoutError('');
              }}
            />
          </Elements>
        )}

        {/* Action buttons — hidden when the card form is showing (it has its own) */}
        {!showingPaymentForm && (
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            {selectedMethod === 'stripe' ? (
              <>
                <Button onClick={handleLoadCardForm} loading={processing || loading} className="flex-1">
                  Pay with Card
                </Button>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
              </>
            ) : selectedMethod ? (
              <>
                <Button onClick={handleOfflineSubmit} loading={processing || loading} className="flex-1">
                  Confirm {selectedMethodData?.label.split(' ').slice(1).join(' ')}
                </Button>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
              </>
            ) : (
              <Button variant="ghost" onClick={onClose} className="w-full">
                Cancel
              </Button>
            )}
          </div>
        )}

        {selectedMethod && selectedMethod !== 'stripe' && !showingPaymentForm && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your ticket will be marked as pending until payment is confirmed.
          </p>
        )}

      </div>
    </Modal>
  );
}
