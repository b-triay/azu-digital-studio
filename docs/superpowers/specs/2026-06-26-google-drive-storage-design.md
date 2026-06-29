# Google Drive Storage Integration

**Date:** 2026-06-26  
**Status:** Approved

## Problem

Supabase Storage free tier provides only 1 GB total. The portal needs to support videos (including YouTube-quality exports) and large asset bundles. The user has a personal Google account with 5 TB available via an educational benefit.

## Goal

Replace Supabase Storage with Google Drive as the file storage backend for the client portal, supporting files of any size (including multi-GB videos), with private expiring-session downloads.

## Non-goals

- Migrating existing files (none in production)
- Public shareable download links
- OAuth login flow for the user (service account handles auth server-side)

---

## Architecture

```
Browser (staff)
    │
    ├─ 1. POST /api/files/upload-session  ──► Next.js API Route
    │       { clientId, filename, mimeType, size }    │
    │                                                 └─► Drive API: create resumable session
    │                                                     returns { uploadUrl, driveFileId }
    │
    ├─ 2. PUT {uploadUrl}  ─────────────────────────────────► Google Drive
    │       (XHR direct upload with onprogress)              (bypasses Vercel entirely)
    │
    ├─ 3. POST /api/files/register  ───► Next.js API Route
    │       { driveFileId, clientId,               │
    │         name, sizeBytes, type }               └─► Supabase DB: INSERT client_files
    │
    ├─ 4. GET /api/files/download/[driveFileId]  ─► Next.js API Route
    │       (requires active Supabase session)          ├─ verify session → 401 if invalid
    │                                                   └─► proxy stream from Drive
    │
    └─ 5. DELETE /api/files/[driveFileId]  ────► Next.js API Route
                                                    ├─ verify staff session
                                                    ├─ Drive API: delete file
                                                    └─► Supabase DB: DELETE client_files row
```

---

## Google Cloud Setup (manual, one-time)

Already completed:
- Google Drive API enabled on project `gen-lang-client-0523886831`
- Service account `azu-portal-storage@gen-lang-client-0523886831.iam.gserviceaccount.com` created
- JSON key downloaded
- Drive folder created, shared with service account (Editor permission)

## Environment Variables

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=azu-portal-storage@gen-lang-client-0523886831.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=<folder id from Drive URL>
```

These go in Vercel environment variables and `.env.local`. Never committed to git.

---

## New dependency

```
googleapis
```

---

## New files

### `lib/google-drive.ts`
Singleton that initializes the Google Drive API client using service account credentials from env vars. Exports helper functions used by the API routes:
- `createUploadSession(filename, mimeType, size, parentFolderId)` → `{ uploadUrl, driveFileId }`
- `deleteFile(driveFileId)`
- `getFileStream(driveFileId)` → readable stream + metadata (name, mimeType)

### `app/api/files/upload-session/route.ts`
`POST` — Staff only. Calls `createUploadSession`. Returns `{ uploadUrl }`.

> **Note (implementation divergence):** The original spec showed `{ uploadUrl, driveFileId }` but Google Drive's resumable upload API does not return the file ID at session creation time — it only returns the `uploadUrl`. The `driveFileId` is returned by Google in the XHR response body when the upload completes (Step 2). The client then passes it to `/api/files/register`.

### `app/api/files/register/route.ts`
`POST` — Staff only. Inserts into `client_files` with `drive_file_id`, sets `file_path` and `file_url` to null.

### `app/api/files/download/[driveFileId]/route.ts`
`GET` — Any authenticated user. Verifies Supabase session. For staff: any file. For clients: only files where `client_files.client_id` matches their own client record (looked up by `auth.uid()`). Returns 403 if client tries to access another client's file. Pipes Drive stream to response with correct `Content-Type` and `Content-Disposition: attachment` headers.

### `app/api/files/[driveFileId]/route.ts`
`DELETE` — Staff only. Calls `deleteFile`, then deletes row from `client_files`.

---

## Supabase Schema Migration

```sql
ALTER TABLE client_files ADD COLUMN drive_file_id TEXT;
ALTER TABLE client_files ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE client_files ALTER COLUMN file_url DROP NOT NULL;
```

New rows: `drive_file_id` populated, `file_path` and `file_url` null.

---

## Client-side changes (`app/[locale]/portal/staff/files/page.tsx`)

Replace `handleUpload`, `handleDelete`, and `handleDownload` functions:

**Upload flow:**
1. `fetch POST /api/files/upload-session` → `{ uploadUrl, driveFileId }`
2. `new XMLHttpRequest()` PUT to `uploadUrl` with `onprogress` for real progress tracking
3. On XHR completion: `fetch POST /api/files/register`
4. Reload file list

**Download:** `window.location.href = /api/files/download/{driveFileId}`

**Delete:** `fetch DELETE /api/files/{driveFileId}`

Update `ClientFile` interface: replace `file_path: string` with `drive_file_id: string`.

Update UI label: "Max 50 MB" → "Images, videos, PDFs, documents" (no size limit copy).

---

## Error handling

- Upload session failure: show error, abort before XHR starts
- XHR upload failure: show Drive error message, do not call `/register`
- Download 401: redirect to login
- Delete failure: show toast, keep file in list

---

## Access control summary

| Route | Who can access |
|---|---|
| `POST /api/files/upload-session` | Staff only |
| `POST /api/files/register` | Staff only |
| `GET /api/files/download/[id]` | Staff (any file) · Client (own files only, 403 otherwise) |
| `DELETE /api/files/[id]` | Staff only |
