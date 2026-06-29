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
