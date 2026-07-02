import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { postId } = await params;
  const { action, comment } = (await req.json()) as {
    action: 'approved' | 'rejected';
    comment?: string;
  };

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  // 1. Fetch post info and client info
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('title, scheduled_for, client_id, clients(name)')
    .eq('id', postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const clientData = post.clients;
  const clientName = (Array.isArray(clientData) ? clientData[0] : clientData as any)?.name ?? 'Cliente';
  const scheduledDate = new Date(post.scheduled_for).toLocaleDateString('es-AR', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  // 2. Fetch assigned staff members
  const { data: assignments } = await supabase
    .from('post_assignments')
    .select('staff_members(name, email)')
    .eq('post_id', postId);

  const staffList = (assignments ?? [])
    .map((a: any) => a.staff_members as { name: string; email: string } | null)
    .filter((s): s is { name: string; email: string } => !!s);

  // 3. Prepare recipients
  const DEST_EMAIL = process.env.CONTACT_DEST_EMAIL ?? 'hola@azudigitalstudio.com';
  let toEmails = staffList.map(s => s.email);

  if (toEmails.length === 0) {
    toEmails = [DEST_EMAIL];
  }

  // If in sandbox, override with RESEND_ACCOUNT_EMAIL
  if (process.env.RESEND_ACCOUNT_EMAIL) {
    toEmails = [process.env.RESEND_ACCOUNT_EMAIL];
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[Notification] Resend API key not set. Email not sent to: ${toEmails.join(', ')}`);
    return NextResponse.json({ ok: true, message: 'Email skipped (key not set)' });
  }

  try {
    const resend = new Resend(apiKey);
    const isApproved = action === 'approved';
    const statusLabel = isApproved ? 'Aprobado' : 'Cambios Solicitados';
    const subject = `[${statusLabel}] "${post.title}" — ${clientName}`;

    const htmlContent = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #fafafa;">
        <div style="background: ${isApproved ? '#16a34a' : '#dc2626'}; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">${statusLabel}</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">El cliente ha revisado el contenido</p>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h2 style="color: #0A0F1C; margin: 0 0 16px; font-size: 18px; font-weight: 700;">Detalles de la Publicación</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px; width: 120px;">Título</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0A0F1C; font-size: 14px; font-weight: 600;">${post.title}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Cliente</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0A0F1C; font-size: 14px;">${clientName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 13px;">Programado</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0A0F1C; font-size: 14px;">${scheduledDate}</td>
            </tr>
          </table>
          
          ${comment ? `
            <div style="margin-top: 20px; padding: 16px; background-color: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${isApproved ? '#bbf7d0' : '#fecaca'}; border-radius: 8px;">
              <p style="color: ${isApproved ? '#16a34a' : '#dc2626'}; font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 0 0 6px; letter-spacing: 0.05em;">Feedback del Cliente</p>
              <p style="color: #334155; font-size: 14px; margin: 0; line-height: 1.6; white-space: pre-wrap;">${comment}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 32px; text-align: center;">
            <a href="https://www.azudigitalstudio.com/portal/staff/approvals" style="display: inline-block; background: #0A0F1C; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; box-shadow: 0 2px 4px rgba(10,15,28,0.15);">Ver en el Panel de Control</a>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: 'Azu Digital Studio <onboarding@resend.dev>',
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
