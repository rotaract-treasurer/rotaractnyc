# Google Workspace Integration

This guide covers how to set up and use the Google Workspace integration for the Rotaract NYC portal. The integration connects three Google services:

- **Google Calendar** — Sync portal events to a shared Google Calendar
- **Google Sheets** — Export club data (members, dues, events, attendance) to Sheets
- **Google Drive** — Browse and manage files in a shared Drive folder

---

## Architecture Overview

```
┌──────────────────────────┐
│   Portal Admin Page      │  /portal/admin/google-workspace
│   (React client)         │
└──────────┬───────────────┘
           │ fetch()
           ▼
┌──────────────────────────┐
│   API Routes             │  /api/google/*
│   (Next.js Route Handlers│
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   lib/google/*           │  Service layer
│   client.ts  calendar.ts │
│   sheets.ts  drive.ts    │
└──────────┬───────────────┘
           │ googleapis SDK
           ▼
┌──────────────────────────┐
│   Google Workspace APIs  │
│   Calendar · Sheets ·    │
│   Drive                  │
└──────────────────────────┘
```

**Auth strategies supported:**
1. **Service Account** (recommended) — Server-to-server. No user consent needed.
2. **OAuth2** (optional) — User-delegated. Needed if you want per-user Drive access.

For most club operations, **the service account alone is sufficient**.

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **Select a project** → **New Project**
3. Name it `Rotaract NYC Portal` (or similar)
4. Click **Create**

### Enable APIs

Navigate to **APIs & Services → Library** and enable:

- ✅ **Google Calendar API**
- ✅ **Google Sheets API**
- ✅ **Google Drive API**

Search for each one and click **Enable**.

---

## Step 2: Create a Service Account

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → Service Account**
3. Name: `rotaract-portal-sa`
4. Click **Done** (skip optional permissions)
5. Click on the created service account
6. Go to **Keys** tab → **Add Key → Create new key → JSON**
7. Download the JSON key file

### Set the environment variable

Take the **entire contents** of the downloaded JSON file and set it as an environment variable:

```bash
# In .env.local (for local development)
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"...","client_email":"...@...iam.gserviceaccount.com",...}'

# In production (Vercel, etc.)
# Set as a single-line JSON string in your environment variables
```

> **Important:** Note the `client_email` field — you'll need it to share resources with the service account.

---

## Step 3: Set Up Google Calendar

### Create or choose a calendar

1. Go to [Google Calendar](https://calendar.google.com)
2. On the left sidebar, click **+** next to "Other calendars" → **Create new calendar**
3. Name it `Rotaract NYC Events`
4. Click **Create calendar**

### Share with the service account

1. Go to **Settings** for the new calendar
2. Under **Share with specific people or groups**, click **Add people and groups**
3. Enter the service account email (from the JSON key: `client_email`)
4. Set permission to **Make changes to events**
5. Click **Send**

### Get the Calendar ID

1. In Calendar Settings, scroll to **Integrate calendar**
2. Copy the **Calendar ID** (looks like `abc123@group.calendar.google.com`)
3. Enter it in the admin page: **Portal → Admin → Google Workspace → Overview → Calendar ID**

---

## Step 4: Set Up Google Drive

### Create a shared folder

1. Go to [Google Drive](https://drive.google.com)
2. Click **New → Folder**
3. Name it `Rotaract NYC Documents`
4. Right-click the folder → **Share**
5. Add the service account email as **Editor**
6. Uncheck "Notify people"
7. Click **Share**

### Get the folder ID

1. Open the folder in Drive
2. The URL will look like: `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j`
3. The folder ID is the last part: `1a2b3c4d5e6f7g8h9i0j`
4. Enter it in the admin page: **Portal → Admin → Google Workspace → Overview → Drive Folder ID**

---

## Step 5: Set Up Google Sheets

Sheets integration works in two modes:

### Auto-create (recommended)
Leave the Spreadsheet ID field empty. On first export, a new spreadsheet called "Rotaract NYC — Club Reports" will be created automatically with tabs for Members, Dues, Events, and Attendance.

### Use existing spreadsheet
1. Create or open a Google Sheet
2. Share it with the service account email as **Editor**
3. Copy the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`
4. Enter it in the admin page: **Portal → Admin → Google Workspace → Overview → Spreadsheet ID**

---

## Step 6 (Optional): OAuth2 Setup

Only needed if you want to connect the club's Google account directly (for delegated access). The service account covers most use cases.

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add authorized redirect URI: `https://your-domain.com/api/google/callback`
5. Copy the **Client ID** and **Client Secret**

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/google/callback
```

Then go to the admin page → Overview → click **Connect Google Account** to authorize.

---

## Environment Variables Summary

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_KEY` | ✅ | Full JSON of the service account key file |
| `GOOGLE_CLIENT_ID` | ❌ | OAuth2 Client ID (only for user-delegated access) |
| `GOOGLE_CLIENT_SECRET` | ❌ | OAuth2 Client Secret |
| `GOOGLE_REDIRECT_URI` | ❌ | OAuth2 redirect URI (defaults to `{APP_URL}/api/google/callback`) |

---

## Using the Integration

### Admin Page

Navigate to **Portal → Admin → Google Workspace** (`/portal/admin/google-workspace`)

The page has 5 tabs:

| Tab | Purpose |
|---|---|
| **Overview** | Connection status, resource IDs, quick actions |
| **Calendar** | Sync events, view sync status |
| **Sheets** | Export data, choose export type, view spreadsheet |
| **Drive** | Browse files and folders in the shared Drive |
| **Setup Guide** | In-app setup instructions |

### Calendar Sync

- **Manual sync**: Click "Sync All Events" on the Calendar tab to push all published events
- Events are matched by portal event ID — no duplicates on re-sync
- Updated events get updated in Calendar
- Cancelled events are marked cancelled

### Sheets Export

- **Full export**: Exports Members, Dues, Events, and Attendance to separate tabs
- **Selective export**: Choose to export only one data type
- Header rows are bold and frozen
- Member dues are enriched with member names and emails
- Attendance is enriched with event titles

### Drive Browser

- Browse files and folders in the shared Drive folder
- Click any file to open it in Google Drive
- Direct link to the full Drive folder

---

## API Reference

### `GET /api/google/status`
Returns the current Google Workspace connection status and configuration.

### `POST /api/google/status`
Update Google Workspace settings. Admin only.
```json
{
  "calendarId": "abc@group.calendar.google.com",
  "sheetId": "1BxiMVs...",
  "driveFolderId": "1a2b3c...",
  "enabled": true,
  "calendarEnabled": true,
  "sheetsEnabled": true,
  "driveEnabled": true
}
```

### `GET /api/google/connect`
Returns the OAuth2 consent URL for connecting a Google account. Admin only.

### `GET /api/google/callback`
OAuth2 callback handler. Exchanges code for tokens and redirects back to admin page.

### `GET /api/google/calendar/sync`
List upcoming Google Calendar events.

### `POST /api/google/calendar/sync`
Sync events to Google Calendar. Admin only.
```json
{ "syncAll": true }
// or
{ "eventId": "abc123" }
```

### `POST /api/google/sheets/export`
Export club data to Google Sheets. Admin/Treasurer only.
```json
{ "exportType": "all" }
// or "members", "dues", "events", "attendance"
```

### `GET /api/google/drive/files`
List files in the shared Drive folder. Authenticated members only.
Query params: `folderId`, `q` (search), `pageToken`.

### `POST /api/google/drive/files`
Create a sub-folder in the shared Drive. Admin only.
```json
{ "name": "Meeting Notes 2026" }
```

---

## Firestore Schema

Settings are stored in `settings/google-workspace`:

```typescript
{
  // Resource IDs
  calendarId: string;        // Google Calendar ID
  sheetId: string;           // Google Spreadsheet ID
  driveFolderId: string;     // Google Drive folder ID

  // Feature toggles
  enabled: boolean;
  calendarEnabled: boolean;
  sheetsEnabled: boolean;
  driveEnabled: boolean;

  // OAuth tokens (if using OAuth2)
  tokens?: {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
    token_type: string;
    scope: string;
  };

  // Audit
  updatedAt: string;
  updatedBy: string;
  oauthConnectedAt?: string;
  lastCalendarSync?: string;
  lastCalendarSyncBy?: string;
  lastSheetsExport?: string;
  lastSheetsExportBy?: string;
}
```

---

## Troubleshooting

### "GOOGLE_SERVICE_ACCOUNT_KEY is not configured"
Set the environment variable with the full JSON contents of the service account key file.

### "No calendar ID configured"
Enter the Google Calendar ID on the admin page (Overview tab).

### Calendar events not appearing
1. Make sure the calendar is shared with the service account email
2. The service account needs "Make changes to events" permission
3. Check that events in the portal have status = "published"

### Sheets export fails with permission error
Share the spreadsheet (or its parent folder) with the service account email as Editor.

### Drive listing returns empty
1. Make sure the Drive folder is shared with the service account email
2. Check that files exist in the shared folder (not just in the owner's "My Drive" view)

### OAuth token expired
The system auto-refreshes tokens on each API call. If it still fails, reconnect via Admin → Google Workspace → Connect Google Account.

### Google API quota exceeded
Default quotas are generous (Calendar: 1M queries/day, Sheets: 300 requests/min, Drive: 20,000 queries/day). If you hit limits, add delays between bulk operations.

---

## Security Considerations

- **Service account key** is a secret — never commit it to version control
- **OAuth tokens** are stored in Firestore, encrypted at rest by Firebase
- All API routes require authentication (session cookie verification)
- Admin-only routes additionally check for `board` or `president` role
- The Sheets export route also allows `treasurer` role
- Drive file listing is available to all authenticated members
- Drive folder creation is admin-only
