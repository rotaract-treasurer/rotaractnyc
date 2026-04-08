/**
 * Google Sheets integration.
 *
 * Exports club data (members, dues, attendance, events) to Google Sheets
 * so leadership can view reports in a familiar spreadsheet interface.
 */

import { google, type sheets_v4 } from 'googleapis';
import { getServiceAccountAuth, getAuthedOAuth2Client, getGoogleSettings, isServiceAccountConfigured } from './client';
import type { Member, MemberDues, RotaractEvent, RSVP } from '@/types';

// ─── Helpers ───

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  if (isServiceAccountConfigured()) {
    const auth = getServiceAccountAuth();
    return google.sheets({ version: 'v4', auth: auth as any });
  }
  const oauth = await getAuthedOAuth2Client();
  return google.sheets({ version: 'v4', auth: oauth });
}

async function getDriveClientForSheets() {
  if (isServiceAccountConfigured()) {
    const auth = getServiceAccountAuth();
    return google.drive({ version: 'v3', auth: auth as any });
  }
  const oauth = await getAuthedOAuth2Client();
  return google.drive({ version: 'v3', auth: oauth });
}

// ─── Sheet Creation ───

/**
 * Create a new Google Spreadsheet (if no sheetId is configured)
 * and return its ID. Stores the ID in settings.
 */
export async function ensureSpreadsheet(): Promise<string> {
  const settings = await getGoogleSettings();
  if (settings.sheetId) return settings.sheetId;

  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'Rotaract NYC — Club Reports',
      },
      sheets: [
        { properties: { title: 'Members', index: 0 } },
        { properties: { title: 'Dues', index: 1 } },
        { properties: { title: 'Events', index: 2 } },
        { properties: { title: 'Attendance', index: 3 } },
      ],
    },
  });

  const spreadsheetId = res.data.spreadsheetId!;

  // If using service account and we have a Drive folder, move it there
  if (settings.driveFolderId && isServiceAccountConfigured()) {
    try {
      const drive = await getDriveClientForSheets();
      await drive.files.update({
        fileId: spreadsheetId,
        addParents: settings.driveFolderId,
        fields: 'id, parents',
      });
    } catch (err) {
      console.warn('Could not move spreadsheet to Drive folder:', err);
    }
  }

  return spreadsheetId;
}

// ─── Export Functions ───

/** Export member roster to the "Members" sheet. */
export async function exportMembers(
  spreadsheetId: string,
  members: Member[],
): Promise<void> {
  const sheets = await getSheetsClient();

  const headers = [
    'Name', 'Email', 'Role', 'Status', 'Committee', 'Board Title',
    'Phone', 'Occupation', 'Employer', 'LinkedIn', 'Joined',
  ];

  const rows = members.map((m) => [
    m.displayName,
    m.email,
    m.role,
    m.status,
    m.committee || '',
    m.boardTitle || '',
    m.phone || '',
    m.occupation || '',
    m.employer || '',
    m.linkedIn || '',
    m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '',
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Members!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [headers, ...rows],
    },
  });

  // Format header row bold
  await formatHeaderRow(sheets, spreadsheetId, 0);
}

/** Export dues data to the "Dues" sheet. */
export async function exportDues(
  spreadsheetId: string,
  dues: (MemberDues & { memberName?: string; memberEmail?: string })[],
): Promise<void> {
  const sheets = await getSheetsClient();

  const headers = [
    'Member', 'Email', 'Cycle', 'Status', 'Amount (USD)',
    'Payment Method', 'Paid At', 'Created At',
  ];

  const rows = dues.map((d) => [
    d.memberName || d.memberId,
    d.memberEmail || '',
    d.cycleId,
    d.status,
    ((d.amount || 0) / 100).toFixed(2),
    d.paymentMethod || '',
    d.paidAt ? new Date(d.paidAt).toLocaleDateString() : '',
    d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Dues!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [headers, ...rows],
    },
  });

  await formatHeaderRow(sheets, spreadsheetId, 1);
}

/** Export events to the "Events" sheet. */
export async function exportEvents(
  spreadsheetId: string,
  events: RotaractEvent[],
): Promise<void> {
  const sheets = await getSheetsClient();

  const headers = [
    'Title', 'Date', 'Time', 'Location', 'Type',
    'Status', 'Public', 'Capacity', 'Attendees', 'Slug',
  ];

  const rows = events.map((e) => [
    e.title,
    e.date ? new Date(e.date).toLocaleDateString() : '',
    e.time || '',
    e.location,
    e.type,
    e.status,
    e.isPublic ? 'Yes' : 'No',
    e.capacity?.toString() || 'Unlimited',
    e.attendeeCount?.toString() || '0',
    e.slug,
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Events!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [headers, ...rows],
    },
  });

  await formatHeaderRow(sheets, spreadsheetId, 2);
}

/** Export attendance / RSVP data to the "Attendance" sheet. */
export async function exportAttendance(
  spreadsheetId: string,
  rsvps: (RSVP & { eventTitle?: string })[],
): Promise<void> {
  const sheets = await getSheetsClient();

  const headers = [
    'Event', 'Member', 'RSVP Status', 'Checked In', 'Checked In At', 'RSVP Date',
  ];

  const rows = rsvps.map((r) => [
    r.eventTitle || r.eventId,
    r.memberName,
    r.status,
    r.checkedIn ? 'Yes' : 'No',
    r.checkedInAt ? new Date(r.checkedInAt).toLocaleDateString() : '',
    r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
  ]);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Attendance!A1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [headers, ...rows],
    },
  });

  await formatHeaderRow(sheets, spreadsheetId, 3);
}

/** Bold + freeze the first row of a sheet tab. */
async function formatHeaderRow(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  sheetIndex: number,
) {
  try {
    // Get sheet ID from index
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties',
    });
    const sheetId = meta.data.sheets?.[sheetIndex]?.properties?.sheetId;
    if (sheetId === undefined) return;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: { bold: true },
                  backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                },
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)',
            },
          },
          {
            updateSheetProperties: {
              properties: {
                sheetId,
                gridProperties: { frozenRowCount: 1 },
              },
              fields: 'gridProperties.frozenRowCount',
            },
          },
        ],
      },
    });
  } catch (err) {
    // Non-critical — don't fail the export
    console.warn('Could not format header row:', err);
  }
}

/**
 * Run a full export of all data types.
 * Returns the spreadsheet URL.
 */
export async function exportAllToSheets(data: {
  members: Member[];
  dues: (MemberDues & { memberName?: string; memberEmail?: string })[];
  events: RotaractEvent[];
  rsvps: (RSVP & { eventTitle?: string })[];
}): Promise<{ spreadsheetId: string; url: string }> {
  const spreadsheetId = await ensureSpreadsheet();

  await exportMembers(spreadsheetId, data.members);
  await exportDues(spreadsheetId, data.dues);
  await exportEvents(spreadsheetId, data.events);
  await exportAttendance(spreadsheetId, data.rsvps);

  return {
    spreadsheetId,
    url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
  };
}
