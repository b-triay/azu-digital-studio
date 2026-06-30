import { google } from 'googleapis';
import type { Readable } from 'stream';

function parsePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // Strip accidental surrounding quotes (common when pasting the JSON value verbatim)
  const stripped = raw.trim().replace(/^["']|["']$/g, '');
  // Convert literal \n sequences (Vercel stores them as two chars) to real newlines
  return stripped.replace(/\\n/g, '\n');
}

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: parsePrivateKey(process.env.GOOGLE_PRIVATE_KEY),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
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
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
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
  await drive.files.delete({ fileId: driveFileId });
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
  });

  const content = await drive.files.get(
    { fileId: driveFileId, alt: 'media' },
    { responseType: 'stream' },
  );

  return {
    stream: content.data as unknown as Readable,
    name: meta.data.name ?? 'download',
    mimeType: meta.data.mimeType ?? 'application/octet-stream',
  };
}
