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

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content, clientId, senderName, senderRole } = await req.json() as {
    content: string;
    clientId: string;
    senderName: string;
    senderRole: 'staff' | 'client';
  };

  if (!content || !clientId || !senderName || !senderRole) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Fetch client row to check if this is the internal staff chat
  const { data: clientRow } = await supabase
    .from('clients')
    .select('name, user_id')
    .eq('id', clientId)
    .single();

  if (!clientRow || clientRow.name === 'Chat Interno de Staff') {
    return NextResponse.json({ ok: true, message: 'Internal staff chat skipped' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.RESEND_SENDER_EMAIL ?? 'Azu Digital Studio <onboarding@resend.dev>';
  const defaultStaffEmail = process.env.CONTACT_DEST_EMAIL ?? 'staff@azudigitalstudio.com';

  let toEmails: string[] = [];

  if (senderRole === 'client') {
    // Notify staff: send to main staff inbox
    toEmails = [defaultStaffEmail];
  } else {
    // Notify client: fetch client user email
    if (clientRow.user_id) {
      const admin = getAdmin();
      if (admin) {
        const { data: userRes } = await admin.auth.admin.getUserById(clientRow.user_id);
        if (userRes?.user?.email) {
          toEmails = [userRes.user.email];
        }
      }
    }
  }

  if (toEmails.length === 0) {
    return NextResponse.json({ ok: true, message: 'No recipients found' });
  }

  // Sandbox override
  if (process.env.RESEND_ACCOUNT_EMAIL) {
    toEmails = [process.env.RESEND_ACCOUNT_EMAIL];
  }

  if (!apiKey) {
    console.log(`[Message Notification] Resend API key not set. Skipped email to: ${toEmails.join(', ')}`);
    return NextResponse.json({ ok: true, message: 'Resend not configured' });
  }

  try {
    const resend = new Resend(apiKey);
    const isStaff = senderRole === 'staff';
    const subject = isStaff 
      ? `Nuevo mensaje de tu equipo Azu Digital Studio` 
      : `Nuevo mensaje de cliente: "${clientRow.name}"`;

    const htmlContent = `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background-color: #fafafa;">
        <div style="background: #0A0F1C; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">Tienes un nuevo mensaje</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">Portal de Clientes — Azu Digital Studio</p>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; margin: 0 0 4px; letter-spacing: 0.05em;">Remitente</p>
          <p style="color: #0A0F1C; font-size: 15px; font-weight: 700; margin: 0 0 20px;">${senderName}</p>
          
          <div style="padding: 16px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
            <p style="color: #334155; font-size: 14px; margin: 0; line-height: 1.6; white-space: pre-wrap;">"${content}"</p>
          </div>
          
          <div style="text-align: center;">
            <a href="${isStaff ? 'https://www.azudigitalstudio.com/portal/dashboard/messages' : 'https://www.azudigitalstudio.com/portal/staff/messages'}" style="display: inline-block; background: #B8976C; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(184,151,108,0.25);">Responder en el Portal</a>
          </div>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: senderEmail,
      to: toEmails,
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Message Notification API] Error:', err);
    return NextResponse.json({ error: 'Failed to send notification email' }, { status: 500 });
  }
}
