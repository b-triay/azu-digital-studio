import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      brandName,
      contactName,
      contactEmail,
      projectGoal,
      targetAudience,
      competitors,
      styleTone,
      channels,
      references,
      comments,
    } = body;

    if (!brandName || !contactName || !contactEmail || !projectGoal) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Servicio de email no configurado' }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const DEST_EMAIL = process.env.CONTACT_DEST_EMAIL ?? 'staff@azudigitalstudio.com';
    const toEmail = process.env.RESEND_ACCOUNT_EMAIL ?? DEST_EMAIL;
    const sender = process.env.RESEND_SENDER_EMAIL ?? 'Azu Digital Studio <onboarding@resend.dev>';

    const htmlContent = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#f8fafc;border-radius:24px;border:1px solid #e2e8f0;">
        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:24px;font-weight:900;color:#0A0F1C;letter-spacing:-0.5px;">Azu</span>
          <span style="font-size:13px;color:#5A6B80;margin-left:6px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Digital Studio</span>
        </div>
        
        <h1 style="font-size:22px;font-weight:800;color:#0A0F1C;margin:0 0 24px;text-align:center;border-bottom:2px solid #e2e8f0;padding-bottom:16px;">
          📋 Nuevo Briefing de Marca
        </h1>
        
        <div style="background:#ffffff;padding:24px;border-radius:16px;box-shadow:0 4px 12px rgba(10,15,28,0.03);margin-bottom:24px;">
          <h2 style="font-size:16px;font-weight:700;color:#B8976C;margin:0 0 16px;">Datos de Contacto</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#8A9BB0;width:140px;font-weight:600;">Marca / Empresa:</td>
              <td style="padding:6px 0;font-size:14px;color:#0A0F1C;font-weight:bold;">${brandName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#8A9BB0;font-weight:600;">Contacto:</td>
              <td style="padding:6px 0;font-size:14px;color:#0A0F1C;">${contactName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#8A9BB0;font-weight:600;">Email:</td>
              <td style="padding:6px 0;font-size:14px;color:#2563eb;"><a href="mailto:${contactEmail}" style="color:#2563eb;text-decoration:none;">${contactEmail}</a></td>
            </tr>
          </table>
        </div>

        <div style="background:#ffffff;padding:24px;border-radius:16px;box-shadow:0 4px 12px rgba(10,15,28,0.03);margin-bottom:24px;">
          <h2 style="font-size:16px;font-weight:700;color:#B8976C;margin:0 0 16px;">Detalles del Proyecto</h2>
          
          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Objetivos Principales:</strong>
            ${projectGoal.replace(/\n/g, '<br>')}
          </p>

          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Audiencia o Público Objetivo:</strong>
            ${targetAudience ? targetAudience.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Canales de Comunicación:</strong>
            ${channels && channels.length > 0 ? channels.join(', ') : '—'}
          </p>

          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Competidores de Referencia:</strong>
            ${competitors ? competitors.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Estilo y Tono Deseado:</strong>
            ${styleTone ? styleTone.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Links de Referencia o Inspiración:</strong>
            ${references ? references.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Comentarios Adicionales:</strong>
            ${comments ? comments.replace(/\n/g, '<br>') : '—'}
          </p>
        </div>

        <p style="color:#94a3b8;font-size:11px;text-align:center;margin:0;">
          Este email fue enviado automáticamente desde el portal de Azu Digital Studio.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: sender,
      to: toEmail,
      replyTo: [contactEmail, DEST_EMAIL],
      subject: `📋 Nuevo Briefing de Marca — ${brandName}`,
      html: htmlContent,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
