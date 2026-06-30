import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createUploadSession } from '@/lib/google-drive';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = user.user_metadata?.role as string | undefined;
  if (role !== 'staff' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const filename = decodeURIComponent(req.headers.get('x-filename') ?? 'upload');
  const mimeType = req.headers.get('content-type') ?? 'application/octet-stream';
  const sizeBytes = Number(req.headers.get('content-length') ?? 0);

  let uploadUrl: string;
  try {
    ({ uploadUrl } = await createUploadSession(filename, mimeType, sizeBytes));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Drive session error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
      ...(sizeBytes ? { 'Content-Length': String(sizeBytes) } : {}),
    },
    body: req.body,
    // duplex required for streaming request body in Node.js fetch
    ...({ duplex: 'half' } as object),
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    return NextResponse.json(
      { error: `Drive error ${uploadRes.status}: ${errText}` },
      { status: 502 },
    );
  }

  const driveFile = await uploadRes.json() as { id: string };
  return NextResponse.json({ driveFileId: driveFile.id, sizeBytes });
}
