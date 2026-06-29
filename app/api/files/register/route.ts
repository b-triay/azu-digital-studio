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
