/* FICHIER: app/api/cron/route.ts */
import { NextRequest, NextResponse } from 'next/server'; // MODIFIÉ ICI
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) { // MODIFIÉ ICI (NextRequest)
  try {
    // 1. SÉCURITÉ : MODE DIAGNOSTIC
    const secretParam = req.nextUrl.searchParams.get('secret');
    const authHeader = req.headers.get('Authorization');
    
    if (process.env.CRON_SECRET) {
      const isValid = (secretParam === process.env.CRON_SECRET) || (authHeader === `Bearer ${process.env.CRON_SECRET}`);
      
      if (!isValid) {
        // SI ÇA BLOQUE, LE SERVEUR VA T'AFFICHER POURQUOI :
        return NextResponse.json({ 
            erreur: "Accès refusé", 
            mot_de_passe_attendu_par_vercel: process.env.CRON_SECRET, 
            mot_de_passe_que_tu_as_tape: secretParam 
        }, { status: 401 });
      }
    }

        // 2. GESTION DU TEMPS ULTRA-ROBUSTE (Force le fuseau America/Toronto)
    const now = new Date();
    
    // Date YYYY-MM-DD
    const formatterDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' });
    const todayStr = formatterDate.format(now); // ex: "2026-04-03"

    // Heure (00 à 23)
    const formatterHour = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Toronto', hour: '2-digit', hour12: false });
    const currentHour = formatterHour.format(now); // ex: "08" ou "14"

    // Jour de la semaine (1 = Lundi, 7 = Dimanche)
    const formatterDow = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', weekday: 'short' });
    const dowString = formatterDow.format(now);
    const dowMap: Record<string, number> = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
    const currentDayOfWeek = dowMap[dowString] || 1;

    // Jour du mois (1 à 31)
    const formatterDom = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', day: 'numeric' });
    const currentDayOfMonth = parseInt(formatterDom.format(now), 10);

    console.log(`[Cron] Démarrage. Heure: ${currentHour}:00 EST | Date: ${todayStr} | JourSemaine: ${currentDayOfWeek} | JourMois: ${currentDayOfMonth}`);

    // --- 3. ENVOI DES RELANCES PROSPECTS ---
    // On récupère TOUS les prospects en attente (on filtrera en JavaScript pour éviter les bugs SQL)
    const { data: prospects, error: prospectError } = await supabase.from('prospects')
      .select('*, clients(name, email)')
      .eq('status', 'pending');

    if (prospectError) console.error("[Cron] Erreur fetch prospects:", prospectError);

    let relancesCount = 0;
    if (prospects && prospects.length > 0) {
      for (const p of prospects) {
        // Le prospect doit avoir un message généré, une date de relance valide (<= aujourd'hui), et un email.
        if (p.email_subject && p.email_body && p.followup && p.followup <= todayStr && p.email) {
          try {
            await resend.emails.send({
              from: `L'équipe ${p.clients?.name || 'T-Prospect'} via T-Prospect <solutions@ntersolutions.ca>`,
              to: [p.email],
              subject: p.email_subject,
              text: p.email_body,
            });
            // Passe en 'contacted' pour ne pas le relancer à l'infini
            await supabase.from('prospects').update({ status: 'contacted' }).eq('id', p.id);
            relancesCount++;
          } catch (err) {
            console.error(`[Cron] Erreur envoi relance prospect ID ${p.id}:`, err);
          }
        }
      }
    }
    console.log(`[Cron] ${relancesCount} relances prospect envoyées.`);

    // --- 4. ENVOI DES RAPPORTS AUTOMATIQUES ---
    const { data: clients, error: clientError } = await supabase.from('clients')
      .select('*, prospects(*)')
      .eq('report_mode', 'auto');
    
    if (clientError) console.error("[Cron] Erreur fetch clients:", clientError);

    let rapportsCount = 0;
    if (clients && clients.length > 0) {
      for (const c of clients) {
          if (!c.email) continue;

          // On extrait l'heure configurée par le client (ex: "08:00" -> "08")
          const clientHour = c.report_time ? c.report_time.split(':')[0] : '08';
          const timeMatches = (clientHour === currentHour);
          
          let shouldSend = false;

          // Vérification des fréquences
          if (timeMatches) {
              if (c.report_freq === 'daily') shouldSend = true;
              if (c.report_freq === 'weekly' && parseInt(c.report_day_week) === currentDayOfWeek) shouldSend = true;
              if (c.report_freq === 'monthly' && parseInt(c.report_day_month) === currentDayOfMonth) shouldSend = true;
          }

          if (shouldSend) {
            try {
              const total = c.prospects?.length || 0;
              const accepted = c.prospects?.filter((p:any) => p.status === 'accepted').length || 0;
              const pending = c.prospects?.filter((p:any) => p.status === 'pending').length || 0;
              const refused = c.prospects?.filter((p:any) => p.status === 'refused').length || 0;
              const lang = c.report_lang || 'fr';

              const translations = {
                fr: {
                  sub: `Rapport Automatisé - ${c.name}`,
                  body: `Bonjour,\n\nVoici l'analyse détaillée de votre campagne de prospection pour ${c.name} :\n\n📊 STATISTIQUES :\n- Total Prospects : ${total}\n- Acceptés : ${accepted}\n- En attente : ${pending}\n- Refusés : ${refused}\n\nL'équipe T-Prospect`
                },
                en: {
                  sub: `Automated Report - ${c.name}`,
                  body: `Hello,\n\nHere is the automated report for your campaign for ${c.name}:\n\n📊 STATISTICS:\n- Total Prospects: ${total}\n- Accepted: ${accepted}\n- Pending: ${pending}\n- Refused: ${refused}\n\nThe T-Prospect Team`
                }
              };
              
              const textToSend = translations[lang as 'fr'|'en'] || translations['fr'];
              
              await resend.emails.send({
                from: `T-Prospect <solutions@ntersolutions.ca>`,
                to: [c.email],
                subject: textToSend.sub,
                text: textToSend.body,
              });

              rapportsCount++;
            } catch (err) {
              console.error(`[Cron] Erreur envoi rapport client ID ${c.id}:`, err);
            }
          }
      }
    }
    console.log(`[Cron] ${rapportsCount} rapports automatiques envoyés.`);

    return NextResponse.json({ success: true, message: `Cron exécuté. Relances: ${relancesCount}, Rapports: ${rapportsCount}` });
  } catch (error) {
    console.error("[Cron] Critical Error:", error);
    return NextResponse.json({ error: "Erreur Serveur Cron" }, { status: 500 });
  }
}