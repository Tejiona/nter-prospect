import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const senderEmail = extractEmail(body.from || body.sender || '');
    const subject = body.subject || '';
    const textBody = body.text || body.html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';

    if (!senderEmail) {
      console.log('[Email-Reply] Pas d\'email expéditeur détecté');
      return NextResponse.json({ received: true, action: 'no_sender' });
    }

    console.log(`[Email-Reply] Réponse reçue de: ${senderEmail} | Sujet: ${subject}`);

    const { data: prospects } = await supabase
      .from('prospects')
      .select('id, name, status, client_id, followup_count')
      .eq('email', senderEmail)
      .not('status', 'in', '("accepted","refused")')
      .limit(1);

    if (!prospects || prospects.length === 0) {
      console.log(`[Email-Reply] Aucun prospect actif trouvé pour: ${senderEmail}`);
      return NextResponse.json({ received: true, action: 'no_match' });
    }

    const prospect = prospects[0];
    console.log(`[Email-Reply] Prospect identifié: ${prospect.name} (ID: ${prospect.id})`);

    let newStatus = 'accepted';
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
      const classifyPrompt = `Analyse cette réponse à un email de prospection B2B et classifie l'intention du prospect.

Sujet: "${subject}"
Message: "${textBody.slice(0, 2000)}"

Réponds avec UN SEUL mot parmi:
- ACCEPTED : si le prospect est intéressé, veut discuter, prendre rendez-vous, en savoir plus, ou répond positivement
- REFUSED : si le prospect refuse clairement, demande de ne plus être contacté, se désabonne, ou répond négativement
- NEUTRAL : si la réponse est ambiguë, un accusé de réception automatique, ou hors-sujet

Réponds UNIQUEMENT par: ACCEPTED, REFUSED ou NEUTRAL`;

      const result = await model.generateContent(classifyPrompt);
      const classification = result.response.text().trim().toUpperCase();

      if (classification.includes('REFUSED')) {
        newStatus = 'refused';
      } else if (classification.includes('NEUTRAL')) {
        console.log(`[Email-Reply] Réponse neutre de ${prospect.name}, statut inchangé`);
        return NextResponse.json({ received: true, action: 'neutral', prospect: prospect.name });
      } else {
        newStatus = 'accepted';
      }
    } catch (aiErr) {
      console.error('[Email-Reply] Erreur classification IA, défaut: accepted', aiErr);
      newStatus = 'accepted';
    }

    await supabase.from('prospects').update({
      status: newStatus,
      followup: null,
    }).eq('id', prospect.id);

    console.log(`[Email-Reply] Prospect ${prospect.name} → ${newStatus}`);

    return NextResponse.json({
      received: true,
      action: 'classified',
      prospect: prospect.name,
      status: newStatus,
    });
  } catch (error) {
    console.error('[Email-Reply] Erreur:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

function extractEmail(str: string): string {
  const match = str.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  return match ? match[0].toLowerCase() : '';
}
