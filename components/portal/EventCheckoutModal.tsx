'use client';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/format';
import type { PaymentSettings } from '@/types';

interface EventCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
  ticketType: 'member' | 'guest';
  priceCents: number;
  paymentSettings: PaymentSettings;
  onStripeCheckout: () => Promise<{ clientSecret?: string; url?: string } | null | void>;
  onOfflinePayment: (method: string, proofUrl?: string) => Promise<void>;
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
  loading,
}: EventCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [processing, setProcessing] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [checkoutClientSecret, setCheckoutClientSecret] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  const amount = formatCurrency(priceCents);
  const priceLabel = ticketType === 'member' ? 'Member' : 'Guest';

  const availableMethods: {
    id: PaymentMethod;
    label: string;
    description: string;
    enabled: boolean;
  }[] = [
    {
      id: 'stripe',
      label: '💳 Credit Card',
      description: 'Secure payment with Stripe',
      enabled: true,
    },
    {
      id: 'zelle',
      label: '🏦 Zelle',
      description: paymentSettings.zelleIdentifier ? `${paymentSettings.zelleIdentifier}` : 'Bank transfer',
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

  useEffect(() => {
    if (!open) {
      setSelectedMethod(null);
      setCheckoutClientSecret('');
      setCheckoutUrl('');
      setCheckoutError('');
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open || selectedMethod !== 'stripe' || !checkoutClientSecret || !publishableKey) return;

    let active = true;
    let embeddedCheckout: { mount: (container: HTMLElement) => void; destroy: () => void } | null = null;

    (async () => {
      try {
        setCheckoutError('');
        const stripe = await loadStripe(publishableKey);
        if (!stripe || !active) return;

        const initEmbeddedCheckout = (stripe as any).initEmbeddedCheckout;
        if (typeof initEmbeddedCheckout !== 'function') {
          throw new Error('Embedded checkout is not available.');
        }

        embeddedCheckout = await initEmbeddedCheckout.call(stripe, {
          fetchClientSecret: async () => checkoutClientSecret,
        });

        if (!active || !embeddedCheckout) {
          if (embeddedCheckout) embeddedCheckout.destroy();
          return;
        }

        const container = document.getElementById('event-embedded-checkout');
        if (!container) throw new Error('Embedded checkout container not found.');

        embeddedCheckout.mount(container);
      } catch {
        if (!active) return;
        setCheckoutError('Unable to load in-page card form. You can still use secure popup checkout.');
      }
    })();

    return () => {
      active = false;
      if (embeddedCheckout) embeddedCheckout.destroy();
    };
  }, [open, selectedMethod, checkoutClientSecret, publishableKey]);

  const openStripePopup = (url: string) => {
    const width = 520;
    const height = 760;
    const dualScreenLeft = window.screenLeft ?? window.screenX ?? 0;
    const dualScreenTop = window.screenTop ?? window.screenY ?? 0;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || screen.width;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || screen.height;
    const left = Math.max(0, dualScreenLeft + (viewportWidth - width) / 2);
    const top = Math.max(0, dualScreenTop + (viewportHeight - height) / 2);

    const popup = window.open(
      url,
      'rotaract-event-checkout',
      `popup=yes,width=${width},height=${height},left=${Math.round(left)},top=${Math.round(top)},resizable=yes,scrollbars=yes`
    );

    if (popup) {
      popup.focus();
      onClose();
      return;
    }

    window.location.href = url;
  };

  const handleStripeCheckout = async () => {
    setProcessing(true);
    try {
      setCheckoutError('');
      const result = await onStripeCheckout();
      if (!result) {
        setCheckoutError('Unable to start checkout. Please try again.');
        return;
      }

      if (result.clientSecret && publishableKey) {
        setCheckoutClientSecret(result.clientSecret);
        if (result.url) setCheckoutUrl(result.url);
        return;
      }

      if (result.url) {
        setCheckoutUrl(result.url);
        openStripePopup(result.url);
        return;
      }

      setCheckoutError('Checkout session could not be created. Please try again.');
    } finally {
      setProcessing(false);
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

  return (
    <Modal open={open} onClose={onClose} title={`Buy ${priceLabel} Ticket - ${amount}`}>
      <div className="space-y-4">
        {/* Price summary */}
        <Card padding="md" className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">{eventTitle}</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{amount}</div>
            <div className="text-xs text-gray-500 mt-1 uppercase tracking-wide">{priceLabel} Ticket</div>
          </div>
        </Card>

        {/* Payment methods */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Choose Payment Method
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {availableMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
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
                      className={`w-5 h-5 rounded-full border-2 ${
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

        {/* Method-specific details */}
        {selectedMethod && selectedMethod !== 'stripe' && (
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
                <div className="text-xs text-gray-500 mt-2">
                  Please include your name and &quot;Event Ticket&quot; in the transfer reference.
                </div>
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
                <div className="text-xs text-gray-500 mt-2">
                  Please note &quot;Event Ticket&quot; in your Venmo memo.
                </div>
              </div>
            )}
            {selectedMethod === 'cash' && (
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white">Cash Payment</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Pay {amount} in cash at the event or during a club meeting.
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Our treasurer will mark your ticket as paid when payment is received.
                </div>
              </div>
            )}
            {selectedMethod === 'check' && (
              <div className="space-y-2 text-sm">
                <div className="font-semibold text-gray-900 dark:text-white">Check Payment</div>
                <div className="text-gray-600 dark:text-gray-400">
                  Mail a check for {amount} payable to &quot;Rotaract NYC&quot; with reference &quot;Event Ticket&quot;.
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Contact the treasurer for the mailing address.
                </div>
              </div>
            )}
          </Card>
        )}

        {selectedMethod === 'stripe' && (
          <Card padding="md" className="bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Pay securely without leaving this page.
            </div>

            {checkoutError && (
              <p role="alert" aria-live="assertive" className="text-sm text-red-600 dark:text-red-400">
                {checkoutError}
              </p>
            )}

            {!publishableKey && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                In-page checkout key is not configured. We&apos;ll open secure popup checkout instead.
              </p>
            )}

            {checkoutClientSecret && publishableKey && (
              <div
                id="event-embedded-checkout"
                className="min-h-[520px] rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
              />
            )}

            {checkoutUrl && (
              <div className="pt-1">
                <Button variant="outline" size="sm" onClick={() => openStripePopup(checkoutUrl)}>
                  Open secure popup checkout instead
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          {selectedMethod === 'stripe' ? (
            <>
              <Button
                onClick={handleStripeCheckout}
                loading={processing || loading}
                className="flex-1"
              >
                {checkoutClientSecret && publishableKey ? 'Refresh Card Checkout' : 'Pay with Card'}
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </>
          ) : selectedMethod ? (
            <>
              <Button
                onClick={handleOfflineSubmit}
                loading={processing || loading}
                className="flex-1"
              >
                Confirm {selectedMethodData?.label.split(' ')[0]}
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </>
          ) : (
            <Button variant="ghost" onClick={onClose} className="w-full">
              Cancel
            </Button>
          )}
        </div>

        {/* Info message */}
        {selectedMethod && selectedMethod !== 'stripe' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your ticket will be marked as pending until payment is confirmed.
          </div>
        )}
      </div>
    </Modal>
  );
}
