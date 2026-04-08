'use client';

import { useEffect, useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import MemberGuidePDF from '@/components/pdf/MemberGuidePDF';
import AdminGuidePDF from '@/components/pdf/AdminGuidePDF';

interface Props {
  guide: 'member' | 'admin';
}

export default function PDFDownloader({ guide }: Props) {
  const [status, setStatus] = useState<'generating' | 'done' | 'error'>('generating');

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      try {
        const doc = guide === 'member' ? <MemberGuidePDF /> : <AdminGuidePDF />;
        const blob = await pdf(doc).toBlob();

        if (cancelled) return;

        // Trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          guide === 'member'
            ? 'Rotaract-NYC-Member-Guide.pdf'
            : 'Rotaract-NYC-Admin-Guide.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setStatus('done');
      } catch (err) {
        console.error('PDF generation failed:', err);
        if (!cancelled) setStatus('error');
      }
    }

    generate();
    return () => { cancelled = true; };
  }, [guide]);

  if (status === 'generating') {
    return (
      <button disabled className="btn-lg btn-gold flex items-center gap-2 opacity-80 cursor-wait">
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Generating PDF…
      </button>
    );
  }

  if (status === 'error') {
    return (
      <button
        onClick={() => setStatus('generating')}
        className="btn-lg bg-red-600 text-white hover:bg-red-700 rounded-xl flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry Download
      </button>
    );
  }

  return (
    <button
      onClick={() => setStatus('generating')}
      className="btn-lg btn-gold flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Downloaded ✓ — Click to re-download
    </button>
  );
}
