import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';

/* ─── Brand colours (matched to AdminGuidePDF) ─── */
const C = {
  cranberry: '#9b1b30',
  cranberryLight: '#f9e4e8',
  gold: '#ebc85b',
  goldLight: '#fdf8e8',
  dark: '#111827',
  gray700: '#374151',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray200: '#e5e7eb',
  gray100: '#f3f4f6',
  gray50: '#f9fafb',
  white: '#ffffff',
  green: '#065f46',
  greenBg: '#d1fae5',
  amber: '#92400e',
  amberBg: '#fef3c7',
  azure: '#1e40af',
  azureBg: '#dbeafe',
};

const s = StyleSheet.create({
  page: {
    paddingTop: 110,
    paddingBottom: 50,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.dark,
    lineHeight: 1.4,
  },
  /* Header band */
  brandBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: C.cranberry,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  brandLogo: {
    height: 70,
    width: 140,
    objectFit: 'contain' as const,
  },
  brandTag: {
    fontSize: 8,
    color: C.gold,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },
  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.gray200,
    paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.gray400 },

  /* Title block */
  reportLabel: {
    fontSize: 8,
    color: C.cranberry,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
    marginBottom: 8,
    lineHeight: 1,
  },
  eventTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: C.dark,
    lineHeight: 1.2,
    marginBottom: 6,
  },
  eventMeta: {
    fontSize: 10,
    color: C.gray500,
    lineHeight: 1.3,
    marginBottom: 16,
  },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: C.gray50,
    borderWidth: 1,
    borderColor: C.gray200,
    borderRadius: 4,
    padding: 8,
  },
  statLabel: {
    fontSize: 7,
    color: C.gray500,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 2,
    fontFamily: 'Helvetica-Bold',
  },
  statValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: C.cranberry,
  },

  /* Section */
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: C.cranberry,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.cranberry,
  },

  /* Table */
  table: { borderWidth: 1, borderColor: C.gray200, borderRadius: 3, marginBottom: 14 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.cranberry,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: C.white,
    padding: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray200,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: C.gray200,
    backgroundColor: C.gray50,
  },
  tableCell: { fontSize: 8, color: C.gray700, padding: 6 },

  /* Column widths (sum ≈ 100) */
  colNum:    { width: '5%' },
  colName:   { width: '22%' },
  colKind:   { width: '9%' },
  colEmail:  { width: '24%' },
  colPhone:  { width: '14%' },
  colQty:    { width: '5%', textAlign: 'right' as const },
  colPaid:   { width: '10%', textAlign: 'right' as const },
  colStatus: { width: '11%', textAlign: 'center' as const },

  /* Pills */
  pill: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    textAlign: 'center' as const,
  },
  pillMember: { color: C.cranberry, backgroundColor: C.cranberryLight },
  pillGuest: { color: C.azure, backgroundColor: C.azureBg },
  pillPaid: { color: C.green, backgroundColor: C.greenBg },
  pillFree: { color: C.azure, backgroundColor: C.azureBg },
  pillPending: { color: C.amber, backgroundColor: C.amberBg },
  pillCheckedIn: { color: C.green, backgroundColor: C.greenBg },

  /* Empty */
  empty: {
    padding: 20,
    textAlign: 'center' as const,
    fontSize: 10,
    color: C.gray400,
    fontStyle: 'italic' as const,
  },
});

export interface AttendeePDFRow {
  id: string;
  kind: 'member' | 'guest';
  name: string;
  email: string;
  phone?: string | null;
  quantity: number;
  amountCents: number;
  paymentStatus: string;
  status: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
  tierLabel?: string | null;
}

export interface EventAttendeesPDFProps {
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventLocation?: string;
  generatedAt: string;
  rows: AttendeePDFRow[];
  totals: {
    members: number;
    guests: number;
    tickets: number;
    revenueCents: number;
    checkedIn: number;
  };
}

function fmtCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function BrandBar() {
  // Resolve absolute URL so @react-pdf can fetch the asset reliably.
  const logoSrc =
    typeof window !== 'undefined'
      ? `${window.location.origin}/rotaract-logo-white.png`
      : '/rotaract-logo-white.png';
  return (
    <View style={s.brandBar} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      <Image style={s.brandLogo} src={logoSrc} />
      <Text style={s.brandTag}>Attendee Roster</Text>
    </View>
  );
}

function Footer({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Confidential — Generated {generatedAt}</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

function PaymentPill({ row }: { row: AttendeePDFRow }) {
  const status = row.paymentStatus;
  if (status === 'paid' || (row.kind === 'member' && row.amountCents > 0)) {
    return <Text style={[s.pill, s.pillPaid]}>PAID</Text>;
  }
  if (status === 'free' || row.amountCents === 0) {
    return <Text style={[s.pill, s.pillFree]}>FREE</Text>;
  }
  return <Text style={[s.pill, s.pillPending]}>PENDING</Text>;
}

export default function EventAttendeesPDF({
  eventTitle,
  eventDate,
  eventTime,
  eventLocation,
  generatedAt,
  rows,
  totals,
}: EventAttendeesPDFProps) {
  return (
    <Document
      title={`Attendees — ${eventTitle}`}
      author="Rotaract NYC"
      subject="Event attendee roster"
    >
      <Page size="LETTER" orientation="landscape" style={s.page}>
        <BrandBar />

        <Text style={s.reportLabel}>Event Attendee Roster</Text>
        <Text style={s.eventTitle}>{eventTitle}</Text>
        <Text style={s.eventMeta}>
          {eventDate}
          {eventTime ? `  ·  ${eventTime}` : ''}
          {eventLocation ? `  ·  ${eventLocation}` : ''}
        </Text>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statLabel}>Total Attendees</Text>
            <Text style={s.statValue}>{rows.length}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Members</Text>
            <Text style={s.statValue}>{totals.members}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Guests</Text>
            <Text style={s.statValue}>{totals.guests}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Tickets</Text>
            <Text style={s.statValue}>{totals.tickets}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Checked In</Text>
            <Text style={s.statValue}>{totals.checkedIn}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>Revenue</Text>
            <Text style={s.statValue}>{fmtCurrency(totals.revenueCents)}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Attendee List</Text>

        {rows.length === 0 ? (
          <Text style={s.empty}>No attendees registered for this event yet.</Text>
        ) : (
          <View style={s.table}>
            <View style={s.tableHeader} fixed>
              <Text style={[s.tableHeaderCell, s.colNum]}>#</Text>
              <Text style={[s.tableHeaderCell, s.colName]}>Name</Text>
              <Text style={[s.tableHeaderCell, s.colKind]}>Type</Text>
              <Text style={[s.tableHeaderCell, s.colEmail]}>Email</Text>
              <Text style={[s.tableHeaderCell, s.colPhone]}>Phone</Text>
              <Text style={[s.tableHeaderCell, s.colQty]}>Qty</Text>
              <Text style={[s.tableHeaderCell, s.colPaid]}>Paid</Text>
              <Text style={[s.tableHeaderCell, s.colStatus]}>Status</Text>
            </View>

            {rows.map((r, i) => (
              <View
                key={r.id}
                style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}
                wrap={false}
              >
                <Text style={[s.tableCell, s.colNum]}>{i + 1}</Text>
                <View style={[s.colName, { padding: 6 }]}>
                  <Text style={{ fontSize: 8, color: C.dark, fontFamily: 'Helvetica-Bold' }}>
                    {r.name}
                  </Text>
                  {r.tierLabel ? (
                    <Text style={{ fontSize: 7, color: C.gray500, marginTop: 1 }}>
                      {r.tierLabel}
                    </Text>
                  ) : null}
                </View>
                <View style={[s.colKind, { padding: 6 }]}>
                  <Text style={[s.pill, r.kind === 'member' ? s.pillMember : s.pillGuest]}>
                    {r.kind.toUpperCase()}
                  </Text>
                </View>
                <Text style={[s.tableCell, s.colEmail]}>{r.email || '—'}</Text>
                <Text style={[s.tableCell, s.colPhone]}>{r.phone || '—'}</Text>
                <Text style={[s.tableCell, s.colQty]}>{r.quantity}</Text>
                <Text style={[s.tableCell, s.colPaid]}>
                  {r.amountCents > 0 ? fmtCurrency(r.amountCents) : '—'}
                </Text>
                <View style={[s.colStatus, { padding: 6, flexDirection: 'row', justifyContent: 'center', gap: 3 }]}>
                  <PaymentPill row={r} />
                  {r.checkedIn ? (
                    <Text style={[s.pill, s.pillCheckedIn]}>✓ IN</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <Footer generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}
