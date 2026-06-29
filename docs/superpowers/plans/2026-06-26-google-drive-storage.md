# Google Drive Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase Storage with Google Drive as the file backend for the client portal, supporting multi-GB uploads via browser-direct resumable upload to Drive.

**Architecture:** The server creates a resumable upload session via the Drive API (service account) and returns the upload URL to the browser. The browser uploads directly to Drive (bypassing Vercel), receives the Drive file ID in the response, then calls `/api/files/register` to persist metadata in Supabase. Downloads are proxied through an authenticated Next.js API route.

**Tech Stack:** `googleapis` npm package, Google Drive API v3, Supabase (DB only, no Storage), Next.js App Router API routes, XMLHttpRequest for browser-side upload progress.

## Global Constraints

- No file is committed to git that contains credentials (`.env.local` is gitignored)
- Role check: staff = `user_metadata.role === 'staff' || 'admin'`; client = `user_metadata.role === 'client'`
- All API routes use `createClient` from `@/lib/supabase/server` for session verification
- Follow existing route pattern: `NextRequest` → verify auth → do work → `NextResponse.json()`
- No test framework is configured — verification steps are manual (curl / browser)
- The `drive_file_id` returned by Google after upload completion is the canonical identifier for all operations

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/google-drive.ts` | Create | Drive API client + 3 helpers |
| `app/api/files/upload-session/route.ts` | Create | Create resumable upload session |
| `app/api/files/register/route.ts` | Create | Insert metadata into Supabase after upload |
| `app/api/files/download/[driveFileId]/route.ts` | Create | Authenticated proxy stream from Drive |
| `app/api/files/[driveFileId]/route.ts` | Create | Delete from Drive + Supabase |
| `lib/types.ts` | Modify | Add `drive_file_id` to `ClientFile`, remove `file_url` |
| `app/[locale]/portal/staff/files/page.tsx` | Modify | Replace upload/download/delete handlers |
| `.env.local` | Modify | Add 3 Google env vars |

---

## Task 1: Install dependency, configure env vars, create `lib/google-drive.ts`

**Files:**
- Modify: `package.json` (via npm install)
- Create: `lib/google-drive.ts`
- Modify: `.env.local`

**Interfaces:**
- Produces:
  - `createUploadSession(filename: string, mimeType: string, fileSize: number): Promise<{ uploadUrl: string }>`
  - `deleteFile(driveFileId: string): Promise<void>`
  - `getFileStream(driveFileId: string): Promise<{ stream: import('stream').Readable; name: string; mimeType: string }>`

- [ ] **Step 1: Install googleapis**

```bash
cd /path/to/azu-digital-studio
npm install googleapis
```

Expected: `googleapis` appears in `package.json` dependencies.

- [ ] **Step 2: Add env vars to `.env.local`**

Open `.env.local` and add these three lines. Values come from the downloaded service account JSON (`client_email` and `private_key` fields) and the Drive folder URL.

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=azu-portal-storage@gen-lang-client-0523886831.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

> **Note on `GOOGLE_PRIVATE_KEY`:** In the downloaded JSON the key has literal `\n` characters. Paste the entire value including `-----BEGIN PRIVATE KEY-----` wrapped in double quotes. The code will call `.replace(/\\n/g, '\n')` to unescape them.

- [ ] **Step 3: Create `lib/google-drive.ts`**

```typescript
import { google } from 'googleapis';
import type { Readable } from 'stream';

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `lib/google-drive.ts`. (Other pre-existing errors are acceptable.)

- [ ] **Step 5: Commit**

```bash
git add lib/google-drive.ts package.json package-lock.json
git commit -m "feat: add google-drive helper lib with upload session, delete, stream"
```

---

## Task 2: Supabase schema migration + update `lib/types.ts`

**Files:**
- Modify: `lib/types.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `ClientFile.drive_file_id: string` (replaces `file_path` and `file_url` for new rows)

- [ ] **Step 1: Run migration in Supabase SQL editor**

Open your Supabase project → SQL Editor → run:

```sql
ALTER TABLE client_files ADD COLUMN IF NOT EXISTS drive_file_id TEXT;
ALTER TABLE client_files ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE client_files ALTER COLUMN file_url DROP NOT NULL;
```

Expected: query runs without error. Verify in Table Editor that `drive_file_id` column now exists.

- [ ] **Step 2: Update `ClientFile` in `lib/types.ts`**

Find the `ClientFile` interface (currently lines 62-70) and replace it:

```typescript
export interface ClientFile {
  id: string;
  client_id: string;
  name: string;
  drive_file_id: string;
  file_url?: string | null;
  type: FileType;
  size_bytes?: number;
  created_at: string;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors from `lib/types.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add drive_file_id to ClientFile type and Supabase schema"
```

---

## Task 3: Upload session and register API routes

**Files:**
- Create: `app/api/files/upload-session/route.ts`
- Create: `app/api/files/register/route.ts`

**Interfaces:**
- Consumes: `createUploadSession` from `@/lib/google-drive`
- Produces:
  - `POST /api/files/upload-session` → `{ uploadUrl: string }`
  - `POST /api/files/register` → `{ id: string }`

- [ ] **Step 1: Create `app/api/files/upload-session/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createUploadSession } from '@/lib/google-drive';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = user.user_metadata?.role as string | undefined;
  if (role !== 'staff' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { filename, mimeType, size } = await req.json() as {
    filename: string;
    mimeType: string;
    size: number;
  };

  if (!filename || !mimeType || !size) {
    return NextResponse.json({ error: 'Missing filename, mimeType, or size' }, { status: 400 });
  }

  try {
    const { uploadUrl } = await createUploadSession(filename, mimeType, size);
    return NextResponse.json({ uploadUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Drive error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create `app/api/files/register/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = user.user_metadata?.role as string | undefined;
  if (role !== 'staff' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { driveFileId, clientId, name, sizeBytes, type } = await req.json() as {
    driveFileId: string;
    clientId: string;
    name: string;
    sizeBytes: number;
    type: string;
  };

  if (!driveFileId || !clientId || !name || !type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('client_files')
    .insert({
      drive_file_id: driveFileId,
      client_id: clientId,
      name,
      size_bytes: sizeBytes,
      type,
      file_path: null,
      file_url: null,
    })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
```

- [ ] **Step 3: Start dev server and test upload-session manually**

```bash
npm run dev
```

In a second terminal (replace cookie with a real staff session cookie from browser DevTools):

```bash
curl -X POST http://localhost:3000/api/files/upload-session \
  -H "Content-Type: application/json" \
  -H "Cookie: <your-supabase-session-cookie>" \
  -d '{"filename":"test.txt","mimeType":"text/plain","size":100}'
```

Expected: `{"uploadUrl":"https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=..."}` — a real Google URL.

If you get `{"error":"Unauthorized"}`, you need to include the auth cookie. Log into the portal in the browser, copy the `sb-*-auth-token` cookie from DevTools → Application → Cookies, and pass it with `-H "Cookie: sb-xxx-auth-token=..."`.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add app/api/files/upload-session/route.ts app/api/files/register/route.ts
git commit -m "feat: add upload-session and register API routes for Google Drive"
```

---

## Task 4: Delete and download API routes

**Files:**
- Create: `app/api/files/[driveFileId]/route.ts`
- Create: `app/api/files/download/[driveFileId]/route.ts`

**Interfaces:**
- Consumes: `deleteFile`, `getFileStream` from `@/lib/google-drive`
- Produces:
  - `DELETE /api/files/[driveFileId]` → `{ ok: true }`
  - `GET /api/files/download/[driveFileId]` → binary stream with `Content-Disposition: attachment`

- [ ] **Step 1: Create `app/api/files/[driveFileId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteFile } from '@/lib/google-drive';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ driveFileId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = user.user_metadata?.role as string | undefined;
  if (role !== 'staff' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { driveFileId } = await params;

  try {
    await deleteFile(driveFileId);
  } catch {
    // File may already be gone — proceed to clean up DB record
  }

  const { error } = await supabase
    .from('client_files')
    .delete()
    .eq('drive_file_id', driveFileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Create `app/api/files/download/[driveFileId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { createClient } from '@/lib/supabase/server';
import { getFileStream } from '@/lib/google-drive';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ driveFileId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { driveFileId } = await params;
  const role = user.user_metadata?.role as string | undefined;

  if (role !== 'staff' && role !== 'admin') {
    // Client: verify file belongs to their client record
    const [{ data: fileRecord }, { data: clientRecord }] = await Promise.all([
      supabase
        .from('client_files')
        .select('client_id')
        .eq('drive_file_id', driveFileId)
        .single(),
      supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single(),
    ]);

    if (
      !fileRecord ||
      !clientRecord ||
      fileRecord.client_id !== clientRecord.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const { stream, name, mimeType } = await getFileStream(driveFileId);
    const webStream = Readable.toWeb(stream) as ReadableStream;
    const encodedName = encodeURIComponent(name);

    return new Response(webStream, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Drive error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Manually test delete route**

Upload a small test file directly to the shared Drive folder (any file), copy its ID from the Drive URL, then:

```bash
curl -X DELETE http://localhost:3000/api/files/<driveFileId> \
  -H "Cookie: <staff-session-cookie>"
```

Expected: `{"ok":true}`. Verify the file is gone from Drive.

- [ ] **Step 5: Commit**

```bash
git add app/api/files/[driveFileId]/route.ts app/api/files/download/[driveFileId]/route.ts
git commit -m "feat: add delete and download proxy routes for Google Drive files"
```

---

## Task 5: Update `staff/files/page.tsx`

**Files:**
- Modify: `app/[locale]/portal/staff/files/page.tsx`

**Interfaces:**
- Consumes:
  - `POST /api/files/upload-session` → `{ uploadUrl: string }`
  - `POST /api/files/register` → `{ id: string }`
  - `DELETE /api/files/[driveFileId]`
  - `GET /api/files/download/[driveFileId]` (via `window.location.href`)
- Produces: working upload/download/delete UI backed by Google Drive

- [ ] **Step 1: Update `ClientFile` interface and remove `handleDownload` signed-URL logic**

At the top of `app/[locale]/portal/staff/files/page.tsx`, replace the `ClientFile` interface (lines 9-19):

```typescript
interface ClientFile {
  id: string;
  client_id: string;
  client_name?: string;
  name: string;
  drive_file_id: string;
  type: string;
  size_bytes?: number;
  created_at: string;
}
```

- [ ] **Step 2: Replace `handleUpload` function**

Replace the entire `handleUpload` function (lines 93-135) with:

```typescript
const handleUpload = async (filesToUpload: FileList | null) => {
  if (!filesToUpload || filesToUpload.length === 0 || !uploadClient) return;
  setUploading(true);
  setUploadError('');

  for (let i = 0; i < filesToUpload.length; i++) {
    const file = filesToUpload[i];
    setUploadProgress(0);

    // Step 1: get resumable upload URL from our API
    const sessionRes = await fetch('/api/files/upload-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      }),
    });

    if (!sessionRes.ok) {
      const { error } = await sessionRes.json();
      setUploadError(error ?? 'Failed to start upload');
      setUploading(false);
      setUploadProgress(0);
      return;
    }

    const { uploadUrl } = await sessionRes.json();

    // Step 2: upload directly to Google Drive with progress tracking
    const driveFileId = await new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 90));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText) as { id: string };
          resolve(data.id);
        } else {
          reject(new Error(`Drive upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(file);
    }).catch((err: Error) => {
      setUploadError(err.message);
      return null;
    });

    if (!driveFileId) {
      setUploading(false);
      setUploadProgress(0);
      return;
    }

    // Step 3: register metadata in Supabase
    const registerRes = await fetch('/api/files/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        driveFileId,
        clientId: uploadClient,
        name: file.name,
        sizeBytes: file.size,
        type: detectType(file),
      }),
    });

    if (!registerRes.ok) {
      const { error } = await registerRes.json();
      setUploadError(error ?? 'Failed to register file');
      setUploading(false);
      setUploadProgress(0);
      return;
    }

    setUploadProgress(Math.round(((i + 1) / filesToUpload.length) * 100));
  }

  setUploading(false);
  setUploadProgress(0);
  if (fileInputRef.current) fileInputRef.current.value = '';
  loadFiles();
};
```

- [ ] **Step 3: Replace `handleDelete` function**

Replace the `handleDelete` function (lines 137-145):

```typescript
const handleDelete = async (file: ClientFile) => {
  if (!confirm(`Delete "${file.name}"?`)) return;
  setDeleting(file.id);

  const res = await fetch(`/api/files/${file.drive_file_id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const { error } = await res.json();
    setUploadError(error ?? 'Delete failed');
  }

  setDeleting(null);
  loadFiles();
};
```

- [ ] **Step 4: Replace `handleDownload` function**

Replace the `handleDownload` function (lines 147-160):

```typescript
const handleDownload = (file: ClientFile) => {
  window.location.href = `/api/files/download/${file.drive_file_id}`;
};
```

- [ ] **Step 5: Update the `loadFiles` query**

In `loadFiles` (lines 64-78), the `.select` query currently uses `file_path`. Update the `map` to use `drive_file_id`:

```typescript
const loadFiles = useCallback(async () => {
  setLoading(true);
  const supabase = createClient();
  const { data } = await supabase
    .from('client_files')
    .select('*, clients(name)')
    .order('created_at', { ascending: false });
  if (data) {
    setFiles(data.map((f: Record<string, unknown>) => ({
      ...f,
      client_name: (f.clients as { name: string } | null)?.name ?? 'Unknown',
    })) as ClientFile[]);
  }
  setLoading(false);
}, []);
```

- [ ] **Step 6: Update UI copy — remove "Max 50 MB" label**

Find line 237:
```tsx
<p className="text-xs" style={{ color: '#cbd5e1' }}>Max 50 MB · Images, videos, PDFs, documents</p>
```

Replace with:
```tsx
<p className="text-xs" style={{ color: '#cbd5e1' }}>Images, videos, PDFs, documents · Any size</p>
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: End-to-end test in browser**

1. Run `npm run dev`
2. Log in as staff (`staff@azudigitalstudio.com` / `staff1234` in demo)
3. Go to Staff → Files
4. Select a client, upload a small file (< 1 MB) — verify progress bar shows, file appears in list
5. Upload a larger file (> 50 MB) if available — verify it completes without error
6. Click download — verify browser downloads the file
7. Click delete — verify file disappears from list and from Google Drive

- [ ] **Step 9: Commit**

```bash
git add app/[locale]/portal/staff/files/page.tsx
git commit -m "feat: replace Supabase Storage with Google Drive in staff files page"
```

---

## Post-implementation checklist

- [ ] Add the three `GOOGLE_*` env vars to Vercel project settings (Dashboard → Settings → Environment Variables)
- [ ] Redeploy on Vercel after adding env vars
- [ ] Verify upload works in production with a real file
