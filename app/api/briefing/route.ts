import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      brandName,
      contactName,
      contactEmail,
      brandThreeWords,
      differentiation,
      avoidTopics,
      growthBlockers,
      hasBrandManual,
      brandManualLink,
      productsServices,
      mainProductToBoost,
      priceRange,
      targetAudience,
      productAttractiveness,
      communicationTones,
      referents,
      competitors,
      priorities,
      contentRole,
      videosPerWeek,
    } = body;

    if (!brandName || !contactName || !contactEmail) {
      return NextResponse.json({ error: 'Por favor completa los campos de contacto obligatorios.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Servicio de email no configurado' }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const DEST_EMAIL = process.env.CONTACT_DEST_EMAIL ?? 'staff@azudigitalstudio.com';
    const toEmail = process.env.RESEND_ACCOUNT_EMAIL ?? DEST_EMAIL;
    const sender = process.env.RESEND_SENDER_EMAIL ?? 'Azu Digital Studio <onboarding@resend.dev>';

    // Format Manual de Identidad display
    let brandManualText = 'No especificado';
    if (hasBrandManual === 'yes') {
      brandManualText = 'Sí, cuenta con Manual de Identidad completo';
    } else if (hasBrandManual === 'basic') {
      brandManualText = 'Cuenta con elementos básicos (logo / paleta informal)';
    } else if (hasBrandManual === 'no') {
      brandManualText = 'No cuenta con Manual de Identidad';
    }
    if (brandManualLink) {
      brandManualText += `<br><span style="font-size:12px;color:#2563eb;">Link: <a href="${brandManualLink}" target="_blank" style="color:#2563eb;">${brandManualLink}</a></span>`;
    }

    // Format Priorities
    let prioritiesHtml = '—';
    if (Array.isArray(priorities) && priorities.length > 0) {
      prioritiesHtml = '<ol style="margin:8px 0 0 20px;padding:0;font-size:14px;color:#334155;">' +
        priorities.map((p: any, i: number) => `
          <li style="margin-bottom:6px;">
            <strong>${p.title}</strong>: ${p.desc}
          </li>
        `).join('') +
        '</ol>';
    }

    // Format Content Role
    let contentRoleText = 'No especificado';
    if (contentRole === 'embajador') {
      contentRoleText = `<strong>Embajador de Marca</strong> (Será la voz y rostro en pantalla)`;
      if (videosPerWeek) {
        contentRoleText += `<br><span style="font-size:13px;color:#475569;">Videos por semana realistas: <strong>${videosPerWeek}</strong></span>`;
      }
    } else if (contentRole === 'supervisor') {
      contentRoleText = `<strong>Supervisor de Contenido</strong> (No aparecerá en pantalla, validará el material gráfico/visual)`;
    }

    const htmlContent = `
      <div style="font-family:sans-serif;max-width:680px;margin:0 auto;padding:32px 20px;background:#f8fafc;border-radius:24px;border:1px solid #e2e8f0;">
        <div style="text-align:center;margin-bottom:28px;">
          <span style="font-size:24px;font-weight:900;color:#0A0F1C;letter-spacing:-0.5px;">Azu</span>
          <span style="font-size:13px;color:#5A6B80;margin-left:6px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Digital Studio</span>
        </div>
        
        <h1 style="font-size:22px;font-weight:800;color:#0A0F1C;margin:0 0 24px;text-align:center;border-bottom:2px solid #e2e8f0;padding-bottom:16px;">
          📋 Nuevo Briefing de Marca — ${brandName}
        </h1>
        
        <!-- Contacto -->
        <div style="background:#ffffff;padding:20px 24px;border-radius:16px;box-shadow:0 2px 8px rgba(10,15,28,0.04);margin-bottom:20px;">
          <h2 style="font-size:15px;font-weight:700;color:#B8976C;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">📌 Datos de Contacto</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;font-size:13px;color:#8A9BB0;width:160px;font-weight:600;">Marca / Empresa:</td>
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

        <!-- 1️⃣ Marca Personal y Diferenciación -->
        <div style="background:#ffffff;padding:20px 24px;border-radius:16px;box-shadow:0 2px 8px rgba(10,15,28,0.04);margin-bottom:20px;">
          <h2 style="font-size:15px;font-weight:700;color:#B8976C;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">1️⃣ Marca Personal y Diferenciación</h2>
          
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Marca en 3 palabras:</strong>
            ${brandThreeWords ? brandThreeWords : '—'}
          </p>

          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Diferenciación en el nicho:</strong>
            ${differentiation ? differentiation.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Temas / estilos que NO quieren comunicar:</strong>
            ${avoidTopics ? avoidTopics.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">¿Qué frena la marca hoy?:</strong>
            ${growthBlockers ? growthBlockers.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Manual de Identidad:</strong>
            ${brandManualText}
          </p>
        </div>

        <!-- 2️⃣ Productos / Servicios -->
        <div style="background:#ffffff;padding:20px 24px;border-radius:16px;box-shadow:0 2px 8px rgba(10,15,28,0.04);margin-bottom:20px;">
          <h2 style="font-size:15px;font-weight:700;color:#B8976C;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">2️⃣ Productos / Servicios</h2>
          
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Descripción de Productos / Servicios:</strong>
            ${productsServices ? productsServices.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Producto / Servicio a impulsar:</strong>
            ${mainProductToBoost ? mainProductToBoost.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Rango de Precios:</strong>
            ${priceRange ? priceRange : '—'}
          </p>
        </div>

        <!-- 3️⃣ Público Objetivo -->
        <div style="background:#ffffff;padding:20px 24px;border-radius:16px;box-shadow:0 2px 8px rgba(10,15,28,0.04);margin-bottom:20px;">
          <h2 style="font-size:15px;font-weight:700;color:#B8976C;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">3️⃣ Público Objetivo</h2>
          
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Cliente Ideal (Edad, ubicación, intereses):</strong>
            ${targetAudience ? targetAudience.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Atractivo del producto/servicio para clientes:</strong>
            ${productAttractiveness ? productAttractiveness.replace(/\n/g, '<br>') : '—'}
          </p>
        </div>

        <!-- 4️⃣ Comunicación -->
        <div style="background:#ffffff;padding:20px 24px;border-radius:16px;box-shadow:0 2px 8px rgba(10,15,28,0.04);margin-bottom:20px;">
          <h2 style="font-size:15px;font-weight:700;color:#B8976C;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">4️⃣ Comunicación</h2>
          
          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Tono de Comunicación:</strong>
            ${communicationTones ? communicationTones : '—'}
          </p>

          <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Referentes en el nicho:</strong>
            ${referents ? referents.replace(/\n/g, '<br>') : '—'}
          </p>

          <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Competencia directa:</strong>
            ${competitors ? competitors.replace(/\n/g, '<br>') : '—'}
          </p>
        </div>

        <!-- 5️⃣ Objetivos por Prioridad -->
        <div style="background:#ffffff;padding:20px 24px;border-radius:16px;box-shadow:0 2px 8px rgba(10,15,28,0.04);margin-bottom:20px;">
          <h2 style="font-size:15px;font-weight:700;color:#B8976C;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">5️⃣ ¿Qué queremos lograr? (Prioridad de Objetivos)</h2>
          ${prioritiesHtml}
        </div>

        <!-- 6️⃣ Logística de Contenido -->
        <div style="background:#ffffff;padding:20px 24px;border-radius:16px;box-shadow:0 2px 8px rgba(10,15,28,0.04);margin-bottom:20px;">
          <h2 style="font-size:15px;font-weight:700;color:#B8976C;margin:0 0 16px;text-transform:uppercase;letter-spacing:0.5px;">6️⃣ Logística de Contenido</h2>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;">
            <strong style="display:block;font-size:12px;color:#8A9BB0;text-transform:uppercase;margin-bottom:4px;">Rol en la creación de contenido:</strong>
            ${contentRoleText}
          </p>
        </div>

        <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:24px;">
          Este email fue enviado automáticamente desde el formulario de Briefing de Azu Digital Studio.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: sender,
      to: toEmail,
      replyTo: [contactEmail, DEST_EMAIL],
      subject: `📋 Briefing de Marca — ${brandName}`,
      html: htmlContent,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

