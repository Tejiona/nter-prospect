/* FICHIER: app/api/send-email/route.ts */
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, text, prospectName, clientName } = body;

    if (!to) {
      return NextResponse.json({ error: "Adresse email manquante" }, { status: 400 });
    }

    // Le format officiel de la signature / expéditeur
    const senderName = `L'équipe ${clientName} via NTER Solutions`;

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