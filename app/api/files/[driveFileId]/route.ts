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
