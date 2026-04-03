/* FICHIER: app/api/send-email/route.ts */
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, text, prospectName, clientName, isReport } = body;

    if (!to) {
      return NextResponse.json({ error: "Adresse email manquante" }, { status: 400 });
    }

    // Si c'est un rapport, l'e-mail vient de T-Prospect. Sinon, il vient du client.
    const senderName = isReport ? "T-Prospect" : `L'équipe ${clientName} via T-Prospect`;

    const data = await resend.emails.send({
      from: `${senderName} <solutions@ntersolutions.ca>`,
      to: [to],
      subject: subject,
      text: text,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Erreur d'envoi d'email:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 500 });
  }
}