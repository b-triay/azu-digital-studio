import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const DEST_EMAIL = process.env.CONTACT_DEST_EMAIL ?? 'hola@azudigitalstudio.com';

interface ContactPayload {
  name: string;
  email: string;
  brand: string;
  service: string;
  message: string;
  meetingDate?: string;
  meetingTime?: string;
  locale?: string;
}

export async function POST(req: NextRequest) {
  let body: ContactPayload;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, brand, service, message, meetingDate, meetingTime } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // Save to DB regardless of email sending
  try {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error: dbError } = await supabase.from('contact_submissions').insert({
      name: name.trim(),
      email: email.trim(),
      brand: brand?.trim() || null,
      service: service || null,
      message: message.trim(),
      meeting_date: meetingDate || null,
      meeting_time: meetingTime || null,
      locale: body.locale || 'en',
    });
    if (dbError) console.error('[Contact form] DB insert error:', dbError.message);
  } catch (e) {
    console.error('[Contact form] DB exception:', e);
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log('[Contact form] New submission (RESEND_API_KEY not set):', { name, email, brand, service, message });
    return NextResponse.json({ ok: true });
  }

  try {
    const resend = new Resend(apiKey);

    // With unverified domain, Resend only allows sending TO the account owner email.
    // RESEND_ACCOUNT_EMAIL overrides the to: field for sandbox use.
    // Once azudigitalstudio.com domain is verified in Resend, this restriction lifts.
    const toEmail = process.env.RESEND_ACCOUNT_EMAIL ?? DEST_EMAIL;
    await resend.emails.send({
      from: 'Azu Digital Studio <onboarding@resend.dev>',
      to: toEmail,
      replyTo: [email, DEST_EMAIL],
      subject: `New inquiry from ${name} — ${service || 'General'}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
          <div style="background: #294864; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">New contact form submission</h1>
            <p style="color: rgba(215,224,231,0.7); margin: 8px 0 0; font-size: 14px;">Azu Digital Studio — azudigitalstudio.com</p>
          </div>
          <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px; width: 120px;">Name</td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1a2e3f; font-size: 14px; font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${email}" style="color: #294864; font-size: 14px;">${email}</a></td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">Brand</td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1a2e3f; font-size: 14px;">${brand || '—'}</td></tr>
              <tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">Service</td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #1a2e3f; font-size: 14px;">${service || '—'}</td></tr>
              ${meetingDate ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 13px;">📅 Meeting</td><td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #294864; font-size: 14px; font-weight: 700;">${meetingDate}${meetingTime ? ' at ' + meetingTime : ''}</td></tr>` : ''}
            </table>
            <div style="margin-top: 20px;">
              <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">Message</p>
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; color: #334155; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
            </div>
            <div style="margin-top: 24px; text-align: center;">
              <a href="mailto:${email}?subject=Re: Your inquiry to Azu Digital Studio" style="display: inline-block; background: #294864; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Reply to ${name}</a>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Contact form] Resend error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
