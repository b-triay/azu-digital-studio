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
