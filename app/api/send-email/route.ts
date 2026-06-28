import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import dns from 'dns';

const resend = new Resend(process.env.RESEND_API_KEY);

function checkMx(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      resolve(!err && addresses && addresses.length > 0);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      subject,
      html,
      text,
      senderName = 'TEJIONA AI Solutions',
      skipMxCheck = false,
    } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html or text' },
        { status: 400 }
      );
    }

    const recipients = Array.isArray(to) ? to : [to];

    if (!skipMxCheck) {
      for (const email of recipients) {
        const domain = email.split('@')[1];
        if (!domain) {
          return NextResponse.json({ error: `Invalid email: ${email}` }, { status: 400 });
        }
        const hasMx = await checkMx(domain);
        if (!hasMx) {
          console.warn(`[send-email] MX check failed for ${domain} — email ${email} skipped`);
          return NextResponse.json(
            { error: `Le domaine "${domain}" ne possède pas de serveur mail valide. L'email n'a pas été envoyé pour éviter un bounce.` },
            { status: 422 }
          );
        }
      }
    }

    const { data, error } = await resend.emails.send({
      from: `${senderName} <noreply@donotreply.tejiona.com>`,
      to: recipients,
      subject,
      html: html ?? undefined,
      text: text ?? undefined,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
