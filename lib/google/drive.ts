/**
 * Google Drive integration.
 *
 * Provides a shared Drive folder for the club's documents, accessible
 * through the portal and directly in Google Drive.
 */

import { google, type drive_v3 } from 'googleapis';
import { getServiceAccountAuth, getAuthedOAuth2Client, getGoogleSettings, isServiceAccountConfigured } from './client';

// ─── Helpers ───

async function getDriveClient(): Promise<drive_v3.Drive> {
  if (isServiceAccountConfigured()) {
    const auth = getServiceAccountAuth();
    return google.drive({ version: 'v3', auth: auth as any });
  }
  const oauth = await getAuthedOAuth2Client();
  return google.drive({ version: 'v3', auth: oauth });
}

// ─── Types ───

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  iconLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
  thumbnailLink?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

// ─── Public API ───

/** List files in the configured shared Drive folder. */
export async function listFiles(options?: {
  folderId?: string;
  pageSize?: number;
  pageToken?: string;
  query?: string;
}): Promise<{ files: DriveFile[]; nextPageToken?: string }> {
  const settings = await getGoogleSettings();
  const folderId = options?.folderId || settings.driveFolderId;
  if (!folderId) throw new Error('No Drive folder configured.');

  const drive = await getDriveClient();

  let q = `'${folderId}' in parents and trashed = false`;
  if (options?.query) {
    q += ` and name contains '${options.query.replace(/'/g, "\\'")}'`;
  }

  const res = await drive.files.list({
    q,
    pageSize: options?.pageSize || 50,
    pageToken: options?.pageToken,
    fields: 'nextPageToken, files(id, name, mimeType, webViewLink, iconLink, size, createdTime, modifiedTime, parents, thumbnailLink)',
    orderBy: 'modifiedTime desc',
  });

  const files: DriveFile[] = (res.data.files || []).map((f) => ({
    id: f.id || '',
    name: f.name || '',
    mimeType: f.mimeType || '',
    webViewLink: f.webViewLink || '',
    iconLink: f.iconLink || undefined,
    size: f.size || undefined,
    createdTime: f.createdTime || undefined,
    modifiedTime: f.modifiedTime || undefined,
    parents: f.parents || undefined,
    thumbnailLink: f.thumbnailLink || undefined,
  }));

  return { files, nextPageToken: res.data.nextPageToken || undefined };
}

/** List sub-folders inside the shared Drive folder. */
export async function listFolders(parentFolderId?: string): Promise<DriveFolder[]> {
  const settings = await getGoogleSettings();
  const folderId = parentFolderId || settings.driveFolderId;
  if (!folderId) throw new Error('No Drive folder configured.');

  const drive = await getDriveClient();

  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name, webViewLink)',
    orderBy: 'name',
  });

  return (res.data.files || []).map((f) => ({
    id: f.id || '',
    name: f.name || '',
    webViewLink: f.webViewLink || '',
  }));
}

/** Create a sub-folder inside the shared Drive folder. */
export async function createFolder(name: string, parentFolderId?: string): Promise<DriveFolder> {
  const settings = await getGoogleSettings();
  const folderId = parentFolderId || settings.driveFolderId;
  if (!folderId) throw new Error('No Drive folder configured.');

  const drive = await getDriveClient();

  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [folderId],
    },
    fields: 'id, name, webViewLink',
  });

  return {
    id: res.data.id || '',
    name: res.data.name || name,
    webViewLink: res.data.webViewLink || '',
  };
}

/** Upload a file to the shared Drive folder. */
export async function uploadFile(
  name: string,
  mimeType: string,
  body: Buffer | ReadableStream | NodeJS.ReadableStream,
  folderId?: string,
): Promise<DriveFile> {
  const settings = await getGoogleSettings();
  const targetFolder = folderId || settings.driveFolderId;
  if (!targetFolder) throw new Error('No Drive folder configured.');

  const drive = await getDriveClient();

  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [targetFolder],
    },
    media: {
      mimeType,
      body,
    },
    fields: 'id, name, mimeType, webViewLink, size, createdTime, modifiedTime',
  });

  return {
    id: res.data.id || '',
    name: res.data.name || name,
    mimeType: res.data.mimeType || mimeType,
    webViewLink: res.data.webViewLink || '',
    size: res.data.size || undefined,
    createdTime: res.data.createdTime || undefined,
    modifiedTime: res.data.modifiedTime || undefined,
  };
}

/** Delete a file from Google Drive. */
export async function deleteFile(fileId: string): Promise<void> {
  const drive = await getDriveClient();
  await drive.files.delete({ fileId });
}

/** Get a file's metadata. */
export async function getFile(fileId: string): Promise<DriveFile> {
  const drive = await getDriveClient();
  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, webViewLink, iconLink, size, createdTime, modifiedTime, parents, thumbnailLink',
  });

  return {
    id: res.data.id || '',
    name: res.data.name || '',
    mimeType: res.data.mimeType || '',
    webViewLink: res.data.webViewLink || '',
    iconLink: res.data.iconLink || undefined,
    size: res.data.size || undefined,
    createdTime: res.data.createdTime || undefined,
    modifiedTime: res.data.modifiedTime || undefined,
    parents: res.data.parents || undefined,
    thumbnailLink: res.data.thumbnailLink || undefined,
  };
}

/**
 * Share the club folder with a user (e.g. new board member).
 * `role` is typically 'reader' or 'writer'.
 */
export async function shareWithUser(
  fileId: string,
  email: string,
  role: 'reader' | 'writer' | 'commenter' = 'reader',
): Promise<void> {
  const drive = await getDriveClient();
  await drive.permissions.create({
    fileId,
    requestBody: {
      type: 'user',
      role,
      emailAddress: email,
    },
    sendNotificationEmail: false,
  });
}

/** Make a file/folder accessible to anyone with the link. */
export async function shareWithLink(
  fileId: string,
  role: 'reader' | 'writer' = 'reader',
): Promise<string> {
  const drive = await getDriveClient();
  await drive.permissions.create({
    fileId,
    requestBody: {
      type: 'anyone',
      role,
    },
  });

  const res = await drive.files.get({
    fileId,
    fields: 'webViewLink',
  });

  return res.data.webViewLink || '';
}
