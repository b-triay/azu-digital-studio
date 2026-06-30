import { google } from 'googleapis';
import type { Readable } from 'stream';

function getAuth() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return client;
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

export async function createUploadSession(
  filename: string,
  mimeType: string,
  fileSize: number,
): Promise<{ uploadUrl: string }> {
  const auth = getAuth();
  const { token } = await auth.getAccessToken();
  if (!token) throw new Error('Failed to obtain Google auth token');

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(fileSize),
      },
      body: JSON.stringify({ name: filename, parents: [FOLDER_ID] }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Drive session error ${res.status}: ${text}`);
  }

  const uploadUrl = res.headers.get('Location');
  if (!uploadUrl) throw new Error('Drive did not return a Location header');

  return { uploadUrl };
}

export async function deleteFile(driveFileId: string): Promise<void> {
  const drive = getDrive();
  await drive.files.delete({ fileId: driveFileId, supportsAllDrives: true });
}

export async function getFileStream(driveFileId: string): Promise<{
  stream: Readable;
  name: string;
  mimeType: string;
}> {
  const drive = getDrive();

  const meta = await drive.files.get({
    fileId: driveFileId,
    fields: 'name,mimeType',
    supportsAllDrives: true,
  });

  const content = await drive.files.get(
    { fileId: driveFileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'stream' },
  );

  return {
    stream: content.data as unknown as Readable,
    name: meta.data.name ?? 'download',
    mimeType: meta.data.mimeType ?? 'application/octet-stream',
  };
}
