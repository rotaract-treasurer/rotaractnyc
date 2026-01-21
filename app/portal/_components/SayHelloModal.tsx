'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/firebase/auth';

interface SayHelloModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientEmail: string;
  recipientUid?: string;
}

export default function SayHelloModal({
  isOpen,
  onClose,
  recipientName,
  recipientEmail,
  recipientUid,
}: SayHelloModalProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState(`Hello from ${user?.displayName || 'a fellow Rotaractor'}!`);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError(null);

    try {
      // Send via email
      const mailtoLink = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
        `Hi ${recipientName},\n\n${message}\n\nBest regards,\n${user?.displayName || 'A fellow Rotaractor'}`
      )}`;
      
      window.location.href = mailtoLink;
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setMessage('');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
      setMessage('');
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Say Hello to {recipientName}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Send a friendly message
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={sending}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {success ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-4xl">
                    check_circle
                  </span>
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  Opening email client...
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Your message will be ready to send!
                </p>
              </div>
            ) : (
              <>
                {/* Subject */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white"
                    placeholder="Enter subject"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-slate-900 dark:text-white resize-none"
                    placeholder="Write your message here..."
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {message.length} characters
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-sm">
                      error
                    </span>
                    <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
                  </div>
                )}

                {/* Quick Templates */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    Quick templates:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        setMessage(
                          `Hi ${recipientName}! I'd love to connect and learn more about your involvement with Rotaract NYC. Looking forward to chatting!`
                        )
                      }
                      className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                      👋 Introduction
                    </button>
                    <button
                      onClick={() =>
                        setMessage(
                          `Hey ${recipientName}! I saw your profile in the member spotlight. Would you be interested in collaborating on a project together?`
                        )
                      }
                      className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                      🤝 Collaboration
                    </button>
                    <button
                      onClick={() =>
                        setMessage(
                          `Hi ${recipientName}! I'm new to Rotaract NYC and would appreciate any advice or guidance you might have. Thanks!`
                        )
                      }
                      className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                    >
                      💡 Advice
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!success && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleClose}
                disabled={sending}
                className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">send</span>
                    Send Message
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
