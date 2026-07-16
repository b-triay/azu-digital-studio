import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function getAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const supabase = await createClient();
  const { data: { user: staffUser } } = await supabase.auth.getUser();

  if (!staffUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await params;

  // 1. Fetch post info and client info
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('title, platform, scheduled_for, client_id, clients(name, user_id)')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const clientRow = post.clients as any;
  const clientName = clientRow?.name ?? 'Cliente';
  const userId = clientRow?.user_id;

  if (!userId) {
    return NextResponse.json({ error: 'Client has no linked user account' }, { status: 400 });
  }

  // 2. Fetch client email from auth using admin client
  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
  }

  const { data: userRes, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !userRes?.user) {
    return NextResponse.json({ error: 'Client user not found in auth' }, { status: 404 });
  }

  const clientEmail = userRes.user.email;
  if (!clientEmail) {
    return NextResponse.json({ error: 'Client has no email address' }, { status: 400 });
  }

  let toEmails = [clientEmail];

  // If in sandbox, override with RESEND_ACCOUNT_EMAIL
  if (process.env.RESEND_ACCOUNT_EMAIL) {
    toEmails = [process.env.RESEND_ACCOUNT_EMAIL];
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[Notification Client] Resend API key not set. Email not sent to: ${toEmails.join(', ')}`);
    return NextResponse.json({ ok: true, message: 'Email skipped (key not set)' });
  }

  const scheduledDate = post.scheduled_for
    ? new Date(post.scheduled_for).toLocaleDateString('es-AR', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Pendiente';

  const platformLabels: Record<string, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    email: 'Email Marketing',
  };
  const platformLabel = platformLabels[post.platform] ?? post.platform;

  try {
    const resend = new Resend(apiKey);
    const subject = `Nuevo contenido listo para revisar: "${post.title}"`;

    const htmlContent = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #fafafa;">
        <div style="background: #0A0F1C; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Contenido listo para aprobar</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">Hemos subido una nueva publicación para tu marca</p>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Hola <strong>${clientName}</strong>,
          </p>
          <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Hemos creado y subido una nueva propuesta de contenido para tu revisión. Por favor ingresa al portal de aprobaciones para revisarlo y dar tu aprobación.
          </p>
          
          <h2 style="color: #0A0F1C; margin: 0 0 16px; font-size: 16px; font-weight: 700; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 8px;">Detalles de la Publicación</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 120px;">Título</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0A0F1C; font-size: 14px; font-weight: 600;">${post.title}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Plataforma</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0A0F1C; font-size: 14px;">${platformLabel}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Programado para</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0A0F1C; font-size: 14px;">${scheduledDate}</td>
            </tr>
          </table>
          
          <div style="margin-top: 32px; text-align: center;">
            <a href="https://www.azudigitalstudio.com/portal/dashboard/approvals" style="display: inline-block; background: #B8976C; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(184,151,108,0.25);">Ingresar a Aprobar Contenido</a>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: process.env.RESEND_SENDER_EMAIL ?? 'Azu Digital Studio <onboarding@resend.dev>',
      to: toEmails,
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Notification API] Resend error:', err);
    return NextResponse.json({ error: 'Failed to send notification email' }, { status: 500 });
  }
}
