/* FICHIER: app/api/cron/route.ts */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  try {
    if (process.env.CRON_SECRET && req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    // --- 1. ENVOI DES RELANCES PROSPECTS ---
    const { data: prospects } = await supabase.from('prospects')
      .select('*, clients(name, email)')
      .eq('status', 'pending')
      .not('email_subject', 'is', null)
      .lte('followup', todayStr);

    if (prospects && prospects.length > 0) {
      for (const p of prospects) {
        if (p.email) {
          await resend.emails.send({
            from: `L'équipe ${p.clients.name} via T-Prospect <solutions@ntersolutions.ca>`,
            to: [p.email],
            subject: p.email_subject,
            text: p.email_body,
          });
          await supabase.from('prospects').update({ status: 'contacted' }).eq('id', p.id);
        }
      }
    }

    // --- 2. ENVOI DES RAPPORTS AUTOMATIQUES ---
    const { data: clients } = await supabase.from('clients')
      .select('*, prospects(*)')
      .eq('report_mode', 'auto')
      .not('email', 'is', null);

    if (clients && clients.length > 0) {
      for (const c of clients) {
          const total = c.prospects.length;
          const accepted = c.prospects.filter((p:any) => p.status === 'accepted').length;
          const pending = c.prospects.filter((p:any) => p.status === 'pending').length;
          const refused = c.prospects.filter((p:any) => p.status === 'refused').length;
          const lang = c.report_lang || 'fr';

          // CORRECTION ICI : On sépare la création du dictionnaire et la sélection
          const translations = {
            fr: {
              sub: `Rapport Automatisé - ${c.name}`,
              body: `Bonjour,\n\nVoici le rapport automatisé de votre campagne :\n- Total prospects : ${total}\n- Acceptés : ${accepted}\n- En attente : ${pending}\n- Refusés : ${refused}\n\nL'équipe T-Prospect`
            },
            en: {
              sub: `Automated Report - ${c.name}`,
              body: `Hello,\n\nHere is the automated report for your campaign:\n- Total prospects: ${total}\n- Accepted: ${accepted}\n- Pending: ${pending}\n- Refused: ${refused}\n\nThe T-Prospect Team`
            }
          };
          
          // On choisit la bonne langue (ou le français par défaut)
          const textToSend = translations[lang as 'fr'|'en'] || translations['fr'];
          
          await resend.emails.send({
            from: `T-Prospect <solutions@ntersolutions.ca>`,
            to: [c.email],
            subject: textToSend.sub,
            text: textToSend.body,
          });
      }
    }

    return NextResponse.json({ success: true, message: "Tâches automatisées exécutées." });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Erreur Cron" }, { status: 500 });
  }
}