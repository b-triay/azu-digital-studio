import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.user_metadata?.name ?? '',
    role: u.user_metadata?.role ?? 'client',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }));

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }

  const { email, password, name, role } = await req.json();

  if (!email?.trim() || !password?.trim() || !name?.trim() || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    user_metadata: { name: name.trim(), role },
    email_confirm: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data.user }, { status: 201 });
}
