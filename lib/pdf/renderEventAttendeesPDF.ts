/**
 * Server-side renderer for the EventAttendeesPDF.
 *
 * Wraps `@react-pdf/renderer.renderToBuffer` so the cron worker (and any
 * future API route that needs a PDF on the server) can produce a Buffer
 * suitable for Resend `attachments`.
 */
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import EventAttendeesPDF, {
  type EventAttendeesPDFProps,
} from '@/components/pdf/EventAttendeesPDF';
import { SITE } from '@/lib/constants';

export async function renderEventAttendeesPDF(
  props: Omit<EventAttendeesPDFProps, 'logoSrc'> & { logoSrc?: string },
): Promise<Buffer> {
  const logoSrc = props.logoSrc || `${SITE.url}/rotaract-logo-white.png`;
  // EventAttendeesPDF returns a <Document>, but TS can't see that through the
  // FunctionComponentElement wrapper, so cast for renderToBuffer's signature.
  return renderToBuffer(
    React.createElement(EventAttendeesPDF, { ...props, logoSrc }) as any,
  );
}
