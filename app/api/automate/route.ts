/* FICHIER: app/api/cron/route.ts */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(process.env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

const PLAN_QUOTAS: Record<string, number> = { starter: 500, growth: 1500 };
const MAX_LEADS_PER_RUN = 5;

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
            await supabase.from('prospects').update({ status: 'contacted', followup_count: (p.followup_count || 0) + 1 }).eq('id', p.id);
            relancesCount++;
          } catch (err) {
            console.error(`[Cron] Erreur envoi relance prospect ID ${p.id}:`, err);
          }
        }
      }
    }
    console.log(`[Cron] ${relancesCount} relances prospect envoyées.`);

    // --- 4. GÉNÉRATION AUTOMATIQUE DE LEADS (FORFAITS) ---
    const { data: planClients, error: planError } = await supabase.from('clients')
      .select('*, prospects(*)')
      .not('plan', 'is', null)
      .neq('plan', 'none');

    if (planError) console.error("[Cron] Erreur fetch plan clients:", planError);

    let leadsGenerated = 0;
    let totalLeadsThisRun = 0;

    if (planClients && planClients.length > 0) {
      const monthStart = `${todayStr.slice(0, 7)}-01`;
      const nowDate = new Date();
      const daysInMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0).getDate();

      for (const c of planClients) {
        if (totalLeadsThisRun >= MAX_LEADS_PER_RUN) break;

        const monthlyQuota = PLAN_QUOTAS[c.plan] || 0;
        if (monthlyQuota === 0) continue;
        if (!c.target) { console.log(`[Cron] ${c.name}: cible non renseignée, génération ignorée`); continue; }

        const leadsThisMonth = (c.prospects || []).filter((p: any) => (p.firstcontact || '') >= monthStart).length;
        if (leadsThisMonth >= monthlyQuota) { console.log(`[Cron] ${c.name}: quota mensuel atteint (${leadsThisMonth}/${monthlyQuota})`); continue; }

        const dailyQuota = Math.ceil(monthlyQuota / daysInMonth);
        const leadsToday = (c.prospects || []).filter((p: any) => (p.firstcontact || '') === todayStr).length;
        if (leadsToday >= dailyQuota) { console.log(`[Cron] ${c.name}: quota journalier atteint (${leadsToday}/${dailyQuota})`); continue; }

        const leadsToGenerate = Math.min(dailyQuota - leadsToday, MAX_LEADS_PER_RUN - totalLeadsThisRun);
        const existingNames = (c.prospects || []).map((p: any) => p.name);
        const clientLang = c.report_lang || 'fr';

        console.log(`[Cron] ${c.name}: génération de ${leadsToGenerate} lead(s) (${leadsToday}/${dailyQuota} aujourd'hui, ${leadsThisMonth}/${monthlyQuota} ce mois)`);

        for (let i = 0; i < leadsToGenerate; i++) {
          try {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro", generationConfig: { responseMimeType: "application/json" } });
            const languageInstruction = clientLang === 'en' ? "English" : "Français";
            const prompt = `
              Tu es un expert en prospection B2B travaillant pour : "${c.name}".
              Tu dois rédiger le message obligatoirement en : ${languageInstruction}.
              🚨 PROSPECTS DÉJÀ CONTACTÉS À IGNORER (Anti-doublon) : [${existingNames.join(', ')}]
              Cible : "${c.target}"
              Base de connaissances : """${c.knowledge_base || ''}"""
              Ta mission :
              1. Trouve une entreprise correspondant à la cible et rédige un Cold Email HAUTEMENT PERSONNALISÉ de premier contact.
              2. Extrais ou génère des coordonnées professionnelles plausibles.
              3. Signe l'e-mail EXCLUSIVEMENT avec "L'équipe ${c.name} via NTER Solutions".
              Format JSON strict :
              { "name": "Nom du contact", "company": "Entreprise", "email": "email", "phone": "téléphone", "address": "adresse", "score": 95, "log": "Analyse...", "email_subject": "Sujet", "email_body": "Corps du message" }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const cleanJson = response.text().replace(/```json|```/g, '').trim();
            const data = JSON.parse(cleanJson);

            const leadName = `${data.name} (${data.company})`;
            const followUpDate = new Date(); followUpDate.setDate(followUpDate.getDate() + 3);
            const followUpStr = followUpDate.toISOString().split('T')[0];

            await supabase.from('prospects').insert([{
              client_id: c.id, name: leadName, email: data.email || '', phone: data.phone || '', address: data.address || '',
              firstcontact: todayStr, status: 'pending', followup: followUpStr,
              email_subject: data.email_subject, email_body: data.email_body, followup_count: 0
            }]);

            existingNames.push(leadName);
            leadsGenerated++;
            totalLeadsThisRun++;
            console.log(`[Cron] Lead généré pour ${c.name}: ${leadName}`);
          } catch (err) {
            console.error(`[Cron] Erreur génération lead pour ${c.name}:`, err);
          }
        }
      }
    }
    console.log(`[Cron] ${leadsGenerated} leads auto-générés.`);

    // --- 5. ENVOI DES RAPPORTS AUTOMATIQUES ---
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
              const allProspects = c.prospects || [];
              const total = allProspects.length;
              const accepted = allProspects.filter((p:any) => p.status === 'accepted').length;
              const pending = allProspects.filter((p:any) => p.status === 'pending').length;
              const refused = allProspects.filter((p:any) => p.status === 'refused').length;
              const contacted = allProspects.filter((p:any) => (p.followup_count || 0) > 0).length;
              const totalFollowups = allProspects.reduce((sum:number, p:any) => sum + (p.followup_count || 0), 0);
              const noResponse = allProspects.filter((p:any) => p.status === 'pending' && (p.followup_count || 0) > 0).length;
              const avgFollowups = total > 0 ? (totalFollowups / total).toFixed(1) : '0';
              const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
              const lang = c.report_lang || 'fr';

              const prospectDetailFr = allProspects.map((p:any) => {
                const fc = p.followup_count || 0;
                const st = p.status === 'accepted' ? 'Accepté' : p.status === 'refused' ? 'Refusé' : 'En attente';
                const ret = p.status === 'accepted' || p.status === 'refused' ? '✅ Oui' : '❌ Non';
                return `  - ${p.name} | ${st} | ${fc} relance(s) | Retour : ${ret}`;
              }).join('\n');

              const prospectDetailEn = allProspects.map((p:any) => {
                const fc = p.followup_count || 0;
                const st = p.status === 'accepted' ? 'Accepted' : p.status === 'refused' ? 'Refused' : 'Pending';
                const ret = p.status === 'accepted' || p.status === 'refused' ? '✅ Yes' : '❌ No';
                return `  - ${p.name} | ${st} | ${fc} follow-up(s) | Response: ${ret}`;
              }).join('\n');

              const guidanceFr = [
                accepted > 0 ? '→ Prospects ACCEPTÉS : Planifier un rendez-vous dans les 24h et préparer une offre personnalisée.' : '',
                refused > 0 ? '→ Prospects REFUSÉS : Archiver et analyser les motifs de refus pour ajuster le ciblage.' : '',
                pending > 0 ? '→ Prospects EN ATTENTE : Relancer sous 48h en variant l\'approche si plus de 2 relances effectuées.' : ''
              ].filter(Boolean).join('\n');

              const guidanceEn = [
                accepted > 0 ? '→ ACCEPTED prospects: Schedule a meeting within 24h and prepare a tailored offer.' : '',
                refused > 0 ? '→ REFUSED prospects: Archive and analyze refusal reasons to adjust targeting.' : '',
                pending > 0 ? '→ PENDING prospects: Follow up within 48h, vary approach if more than 2 follow-ups sent.' : ''
              ].filter(Boolean).join('\n');

              const translations = {
                fr: {
                  sub: `Rapport Automatisé - ${c.name}`,
                  body: `Bonjour,\n\nVoici l'analyse détaillée de votre campagne de prospection pour ${c.name} :\n\n📊 STATISTIQUES GÉNÉRALES :\n- Total Prospects : ${total}\n- Acceptés : ${accepted}\n- En attente : ${pending}\n- Refusés : ${refused}\n\n📬 ACTIVITÉ DE CONTACT :\n- Contacts effectués : ${contacted}\n- Relances totales : ${totalFollowups}\n- Moyenne relances/prospect : ${avgFollowups}\n- Sans retour : ${noResponse}\n\n📋 DÉTAIL PAR PROSPECT :\n${prospectDetailFr}\n\n💡 ANALYSE :\nTaux de conversion : ${rate}%. ${pending > 0 ? `Nous recommandons de relancer les ${pending} prospects en attente dans les 48h.` : ''}\n\n🧭 ORIENTATIONS :\n${guidanceFr}\n\nCordialement,\nL'équipe T-Prospect`
                },
                en: {
                  sub: `Automated Report - ${c.name}`,
                  body: `Hello,\n\nHere is the detailed report for your prospecting campaign for ${c.name}:\n\n📊 GENERAL STATISTICS:\n- Total Prospects: ${total}\n- Accepted: ${accepted}\n- Pending: ${pending}\n- Refused: ${refused}\n\n📬 CONTACT ACTIVITY:\n- Contacts made: ${contacted}\n- Total follow-ups: ${totalFollowups}\n- Average follow-ups/prospect: ${avgFollowups}\n- No response: ${noResponse}\n\n📋 PROSPECT BREAKDOWN:\n${prospectDetailEn}\n\n💡 ANALYSIS:\nConversion rate: ${rate}%. ${pending > 0 ? `We recommend following up with the ${pending} pending prospects within 48h.` : ''}\n\n🧭 GUIDANCE:\n${guidanceEn}\n\nBest regards,\nThe T-Prospect Team`
                }
              };

              const textToSend = translations[lang as 'fr'|'en'] || translations['fr'];
              
              await resend.emails.send({
                from: `T-Prospect <solutions@ntersolutions.ca>`,
                to: [c.email],
                subject: textToSend.sub,
                text: textToSend.body,
              });

              await supabase.from('clients').update({ reports_sent: (c.reports_sent || 0) + 1 }).eq('id', c.id);
              rapportsCount++;
            } catch (err) {
              console.error(`[Cron] Erreur envoi rapport client ID ${c.id}:`, err);
            }
          }
      }
    }
    console.log(`[Cron] ${rapportsCount} rapports automatiques envoyés.`);

    return NextResponse.json({ success: true, message: `Cron exécuté. Leads générés: ${leadsGenerated}, Relances: ${relancesCount}, Rapports: ${rapportsCount}` });
  } catch (error) {
    console.error("[Cron] Critical Error:", error);
    return NextResponse.json({ error: "Erreur Serveur Cron" }, { status: 500 });
  }
}