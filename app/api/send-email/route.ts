import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      to,
      subject,
      html,
      text,
      senderName = 'TEJIONA AI Solutions',
    } = body;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html or text' },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: `${senderName} <noreply@donotreply.tejiona.com>`,
      to: Array.isArray(to) ? to : [to],
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
