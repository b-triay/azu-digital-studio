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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }

  const { id } = await params;
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};
  if (body.password) updates.password = body.password;
  if (body.ban_duration !== undefined) updates.ban_duration = body.ban_duration;
  if (body.email) updates.email = body.email;
  if (body.name !== undefined || body.role !== undefined) {
    // Need to fetch existing metadata to merge properly
    const { data: existing } = await admin.auth.admin.getUserById(id);
    const existingMeta = existing?.user?.user_metadata ?? {};
    updates.user_metadata = {
      ...existingMeta,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.role !== undefined ? { role: body.role } : {}),
    };
  }

  const { data, error } = await admin.auth.admin.updateUserById(id, updates);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: data.user });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Service role not configured' }, { status: 503 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({})) as { sendEmail?: boolean };

  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(id);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const email = userData.user.email!;
  const name  = (userData.user.user_metadata?.name as string | undefined) ?? email;

  // Build redirect URL from request host so it works in both dev and prod
  const host     = req.headers.get('host') ?? 'azu-digitalstudio.vercel.app';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl  = `${protocol}://${host}`;
  const redirectTo = `${baseUrl}/auth/callback?next=/es/portal/update-password`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const link = data.properties?.action_link ?? null;

  // Send email via Resend when requested
  if (body.sendEmail && link) {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const { Resend } = await import('resend');
      const resend    = new Resend(apiKey);
      // Sandbox restriction: only sends to the registered Resend account email.
      // Once azudigitalstudio.com is verified in Resend, remove this override.
      const toEmail = process.env.RESEND_ACCOUNT_EMAIL ?? email;

      await resend.emails.send({
        from: 'Azu Digital Studio <onboarding@resend.dev>',
        to: toEmail,
        subject: 'Bienvenido a Azu Digital Studio — Creá tu contraseña',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:16px;">
            <div style="text-align:center;margin-bottom:24px;">
              <span style="font-size:22px;font-weight:900;color:#294864;letter-spacing:-0.5px;">Azu</span>
              <span style="font-size:12px;color:#64748b;margin-left:6px;">Digital Studio</span>
            </div>
            <h1 style="font-size:20px;font-weight:800;color:#1a2e3f;margin:0 0 8px;">Hola, ${name} 👋</h1>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Tu cuenta en el Portal de Clientes de Azu Digital Studio está lista.<br>
              Hacé clic en el botón para crear tu contraseña y acceder a tu panel.
            </p>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${link}"
                style="display:inline-block;background:#294864;color:#fff;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;box-shadow:0 4px 16px rgba(41,72,100,0.3);">
                Crear mi contraseña →
              </a>
            </div>
            <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0;">
              Este link expira en 24 horas. Si no lo solicitaste, ignorá este email.
            </p>
          </div>
        `,
      });
    }
  }

  return NextResponse.json({ ok: true, link });
}
