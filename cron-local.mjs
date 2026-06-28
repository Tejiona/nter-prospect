/**
 * cron-local.mjs - Script autonome d'envoi des relances et rapports T-Prospect
 * Exécuté toutes les heures par le Planificateur de tâches Windows
 * Ne nécessite PAS le serveur Next.js
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

function checkMx(domain) {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      resolve(!err && addresses && addresses.length > 0);
    });
  });
}

// Charger les variables d'environnement depuis .env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, '.env.local'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) env[key.trim()] = rest.join('=').trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const resend = new Resend(env.RESEND_API_KEY);
const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY || "");

const PLAN_QUOTAS = { starter: 500, growth: 1500 };
const MAX_LEADS_PER_RUN = 5;

async function run() {
  const now = new Date();

  // Date YYYY-MM-DD (fuseau America/Toronto)
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const currentHour = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Toronto', hour: '2-digit', hour12: false }).format(now);
  const dowString = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', weekday: 'short' }).format(now);
  const dowMap = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
  const currentDayOfWeek = dowMap[dowString] || 1;
  const currentDayOfMonth = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Toronto', day: 'numeric' }).format(now), 10);

  console.log(`[Cron-Local] Démarrage. Heure: ${currentHour}:00 EST | Date: ${todayStr} | JourSemaine: ${currentDayOfWeek} | JourMois: ${currentDayOfMonth}`);

  // --- ENVOI DES EMAILS / RELANCES PROSPECTS ---
  const { data: prospects, error: prospectError } = await supabase.from('prospects')
    .select('*, clients(name, email, target, knowledge_base, report_lang, plan)')
    .not('status', 'in', '("accepted","refused")');

  if (prospectError) console.error("[Cron-Local] Erreur fetch prospects:", prospectError);

  let relancesCount = 0;
  if (prospects && prospects.length > 0) {
    for (const p of prospects) {
      if (!p.followup || p.followup > todayStr || !p.email) continue;

      const clientPlan = p.clients?.plan || 'none';
      if (clientPlan === 'none') continue;

      // Auto-refus après 5 relances sans réponse
      if (p.status === 'followup_5') {
        await supabase.from('prospects').update({ status: 'refused' }).eq('id', p.id);
        console.log(`[Cron-Local] Auto-refusé: ${p.name} (5 relances sans réponse)`);
        continue;
      }

      if (!p.email_subject || !p.email_body) continue;

      try {
        const clientName = p.clients?.name || 'T-Prospect';
        const currentCount = p.followup_count || 0;

        // Si c'est une relance (pas le 1er contact), générer un nouveau message
        if (currentCount > 0 && p.clients?.target) {
          try {
            const clientLang = p.clients?.report_lang || 'fr';
            const langInst = clientLang === 'en' ? 'English' : 'Français';
            const sigBlock = clientLang === 'en'
              ? `The ${clientName} Team\nsolutions@tejiona.com`
              : `L'équipe ${clientName}\nsolutions@tejiona.com`;
            let cleanName = p.name; let cleanCompany = p.name;
            if (p.name.includes('(')) { const parts = p.name.split(' ('); cleanName = parts[0]; cleanCompany = parts[1].replace(')', ''); }
            const followUpPrompt = `
              Tu es un expert en prospection B2B travaillant pour : "${clientName}".
              Rédige en : ${langInst}.
              Contact : ${cleanName} | Entreprise : ${cleanCompany}
              Base de connaissances : """${p.clients?.knowledge_base || ''}"""
              Rédige un e-mail de RELANCE n°${currentCount} court (80-150 mots), percutant, avec un nouvel angle.
              Fais référence à un précédent message. Apporte une nouvelle valeur. Crée un sentiment d'urgence subtil.
              Signe avec :\n${sigBlock}
              Format JSON strict : { "email_subject": "Sujet", "email_body": "Corps" }
            `;
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro", generationConfig: { responseMimeType: "application/json" } });
            const result = await model.generateContent(followUpPrompt);
            const cleanJson = result.response.text().replace(/```json|```/g, '').trim();
            const newMsg = JSON.parse(cleanJson);
            if (newMsg.email_subject && newMsg.email_body) {
              await supabase.from('prospects').update({ email_subject: newMsg.email_subject, email_body: newMsg.email_body }).eq('id', p.id);
              p.email_subject = newMsg.email_subject;
              p.email_body = newMsg.email_body;
            }
          } catch (genErr) {
            console.error(`[Cron-Local] Erreur génération relance pour ${p.name}:`, genErr);
          }
        }

        const emailDomain = p.email.split('@')[1];
        const hasMx = emailDomain ? await checkMx(emailDomain) : false;
        if (!hasMx) {
          console.warn(`[Cron-Local] MX check failed for ${emailDomain} — skipping ${p.email}`);
          continue;
        }

        await resend.emails.send({
          from: `${clientName} <noreply@donotreply.tejiona.com>`,
          to: [p.email],
          subject: p.email_subject,
          text: p.email_body,
        });

        const newCount = currentCount + 1;
        let newStatus;
        if (newCount === 1) { newStatus = 'contacted'; }
        else { const followupNum = newCount - 1; newStatus = followupNum > 5 ? 'refused' : `followup_${followupNum}`; }

        const nextFollowUp = new Date();
        const daysAhead = 5 + Math.floor(Math.random() * 5);
        nextFollowUp.setDate(nextFollowUp.getDate() + daysAhead);
        if (nextFollowUp.getDay() === 0) nextFollowUp.setDate(nextFollowUp.getDate() + 1);
        if (nextFollowUp.getDay() === 6) nextFollowUp.setDate(nextFollowUp.getDate() + 2);
        const nextFollowUpStr = nextFollowUp.toISOString().split('T')[0];

        await supabase.from('prospects').update({
          followup_count: newCount,
          status: newStatus,
          followup: newStatus === 'refused' ? null : nextFollowUpStr,
        }).eq('id', p.id);
        relancesCount++;
        console.log(`[Cron-Local] Email envoyé à ${p.name} → ${newStatus}`);
      } catch (err) {
        console.error(`[Cron-Local] Erreur envoi email prospect ${p.id}:`, err);
      }
    }
  }
  console.log(`[Cron-Local] ${relancesCount} relances envoyées.`);

  // --- GÉNÉRATION AUTOMATIQUE DE LEADS (FORFAITS) ---
  const { data: planClients, error: planError } = await supabase.from('clients')
    .select('*, prospects(*)')
    .not('plan', 'is', null)
    .neq('plan', 'none');

  if (planError) console.error("[Cron-Local] Erreur fetch plan clients:", planError);

  let leadsGenerated = 0;
  let totalLeadsThisRun = 0;

  if (planClients && planClients.length > 0) {
    const monthStart = `${todayStr.slice(0, 7)}-01`;
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    for (const c of planClients) {
      if (totalLeadsThisRun >= MAX_LEADS_PER_RUN) break;

      const monthlyQuota = PLAN_QUOTAS[c.plan] || 0;
      if (monthlyQuota === 0) continue;
      if (!c.target) { console.log(`[Cron-Local] ${c.name}: cible non renseignée, génération ignorée`); continue; }

      const leadsThisMonth = (c.prospects || []).filter(p => (p.firstcontact || '') >= monthStart).length;
      if (leadsThisMonth >= monthlyQuota) { console.log(`[Cron-Local] ${c.name}: quota mensuel atteint (${leadsThisMonth}/${monthlyQuota})`); continue; }

      const dailyQuota = Math.ceil(monthlyQuota / daysInMonth);
      const leadsToday = (c.prospects || []).filter(p => (p.firstcontact || '') === todayStr).length;
      if (leadsToday >= dailyQuota) { console.log(`[Cron-Local] ${c.name}: quota journalier atteint (${leadsToday}/${dailyQuota})`); continue; }

      const leadsToGenerate = Math.min(dailyQuota - leadsToday, MAX_LEADS_PER_RUN - totalLeadsThisRun);
      const existingNames = (c.prospects || []).map(p => p.name);
      const clientLang = c.report_lang || 'fr';

      console.log(`[Cron-Local] ${c.name}: génération de ${leadsToGenerate} lead(s) (${leadsToday}/${dailyQuota} aujourd'hui, ${leadsThisMonth}/${monthlyQuota} ce mois)`);

      for (let i = 0; i < leadsToGenerate; i++) {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro", generationConfig: { responseMimeType: "application/json" } });
          const languageInstruction = clientLang === 'en' ? "English" : "Français";
          const sigBlock = clientLang === 'en'
            ? `The ${c.name} Team\nsolutions@tejiona.com`
            : `L'équipe ${c.name}\nsolutions@tejiona.com`;
          const prompt = `
            Tu es un expert en prospection B2B travaillant pour : "${c.name}".
            Tu dois rédiger le message obligatoirement en : ${languageInstruction}.
            🚨 PROSPECTS DÉJÀ CONTACTÉS À IGNORER (Anti-doublon) : [${existingNames.join(', ')}]
            Cible : "${c.target}"
            Base de connaissances : """${c.knowledge_base || ''}"""
            Ta mission :
            1. Trouve une entreprise correspondant à la cible et rédige un Cold Email HAUTEMENT PERSONNALISÉ de premier contact.
            2. Extrais ou génère des coordonnées professionnelles plausibles.
            3. Signe l'e-mail EXCLUSIVEMENT avec :\n${sigBlock}\nN'utilise jamais "via NTER Solutions".
            Format JSON strict :
            { "name": "Nom du contact", "company": "Entreprise", "email": "email", "phone": "téléphone", "address": "adresse", "score": 95, "log": "Analyse...", "email_subject": "Sujet", "email_body": "Corps du message" }
          `;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const cleanJson = response.text().replace(/```json|```/g, '').trim();
          const data = JSON.parse(cleanJson);

          const leadName = `${data.name} (${data.company})`;
          const followUpDate = new Date();
          const daysAhead = 5 + Math.floor(Math.random() * 5);
          followUpDate.setDate(followUpDate.getDate() + daysAhead);
          if (followUpDate.getDay() === 0) followUpDate.setDate(followUpDate.getDate() + 1);
          if (followUpDate.getDay() === 6) followUpDate.setDate(followUpDate.getDate() + 2);
          const followUpStr = followUpDate.toISOString().split('T')[0];

          await supabase.from('prospects').insert([{
            client_id: c.id, name: leadName, email: data.email || '', phone: data.phone || '', address: data.address || '',
            firstcontact: todayStr, status: 'pending', followup: followUpStr,
            email_subject: data.email_subject, email_body: data.email_body, followup_count: 0
          }]);

          existingNames.push(leadName);
          leadsGenerated++;
          totalLeadsThisRun++;
          console.log(`[Cron-Local] Lead généré pour ${c.name}: ${leadName}`);
        } catch (err) {
          console.error(`[Cron-Local] Erreur génération lead pour ${c.name}:`, err);
        }
      }
    }
  }
  console.log(`[Cron-Local] ${leadsGenerated} leads auto-générés.`);

  // --- RAPPORTS AUTOMATIQUES ---
  const { data: clients, error: clientError } = await supabase.from('clients')
    .select('*, prospects(*)')
    .eq('report_mode', 'auto');

  if (clientError) console.error("[Cron-Local] Erreur fetch clients:", clientError);

  let rapportsCount = 0;
  if (clients && clients.length > 0) {
    for (const c of clients) {
      if (!c.email) continue;

      const clientHour = c.report_time ? c.report_time.split(':')[0] : '08';
      const timeMatches = (clientHour === currentHour);
      let shouldSend = false;

      if (timeMatches) {
        if (c.report_freq === 'daily') shouldSend = true;
        if (c.report_freq === 'weekly' && parseInt(c.report_day_week) === currentDayOfWeek) shouldSend = true;
        if (c.report_freq === 'monthly' && parseInt(c.report_day_month) === currentDayOfMonth) shouldSend = true;
      }

      if (shouldSend) {
        try {
          const allProspects = c.prospects || [];
          const total = allProspects.length;
          const accepted = allProspects.filter(p => p.status === 'accepted').length;
          const pending = allProspects.filter(p => p.status === 'pending').length;
          const refused = allProspects.filter(p => p.status === 'refused').length;
          const contacted = allProspects.filter(p => p.status === 'contacted' || p.status?.startsWith('followup_')).length;
          const totalFollowups = allProspects.reduce((sum, p) => sum + (p.followup_count || 0), 0);
          const noResponse = allProspects.filter(p => (p.status === 'contacted' || p.status?.startsWith('followup_')) && p.status !== 'accepted' && p.status !== 'refused').length;
          const avgFollowups = total > 0 ? (totalFollowups / total).toFixed(1) : '0';
          const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
          const lang = c.report_lang || 'fr';

          const getStatusFr = (s) => s === 'accepted' ? 'Accepté' : s === 'refused' ? 'Refusé' : s === 'contacted' ? 'Contacté' : s?.startsWith('followup_') ? `Relancé (${s.split('_')[1]})` : 'En attente';
          const getStatusEn = (s) => s === 'accepted' ? 'Accepted' : s === 'refused' ? 'Refused' : s === 'contacted' ? 'Contacted' : s?.startsWith('followup_') ? `Follow-up (${s.split('_')[1]})` : 'Pending';

          const prospectDetailFr = allProspects.map(p => {
            const fc = p.followup_count || 0;
            const st = getStatusFr(p.status);
            const ret = p.status === 'accepted' || p.status === 'refused' ? '✅ Oui' : '❌ Non';
            return `  - ${p.name} | ${st} | ${fc} relance(s) | Retour : ${ret}`;
          }).join('\n');

          const prospectDetailEn = allProspects.map(p => {
            const fc = p.followup_count || 0;
            const ret = p.status === 'accepted' || p.status === 'refused' ? '✅ Yes' : '❌ No';
            return `  - ${p.name} | ${getStatusEn(p.status)} | ${fc} follow-up(s) | Response: ${ret}`;
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
              body: `Bonjour,\n\nVoici l'analyse détaillée de votre campagne de prospection pour ${c.name} :\n\n📊 STATISTIQUES GÉNÉRALES :\n- Total Prospects : ${total}\n- Acceptés : ${accepted}\n- En attente : ${pending}\n- Refusés : ${refused}\n\n📬 ACTIVITÉ DE CONTACT :\n- Contacts effectués : ${contacted}\n- Relances totales : ${totalFollowups}\n- Moyenne relances/prospect : ${avgFollowups}\n- Sans retour : ${noResponse}\n\n📋 DÉTAIL PAR PROSPECT :\n${prospectDetailFr}\n\n💡 ANALYSE :\nTaux de conversion : ${rate}%. ${pending > 0 ? `Nous recommandons de relancer les ${pending} prospects en attente dans les 48h.` : ''}\n\n🧭 ORIENTATIONS :\n${guidanceFr}\n\nCordialement,\nL'équipe Tejiona AI Solutions\nsolutions@tejiona.com`
            },
            en: {
              sub: `Automated Report - ${c.name}`,
              body: `Hello,\n\nHere is the detailed report for your prospecting campaign for ${c.name}:\n\n📊 GENERAL STATISTICS:\n- Total Prospects: ${total}\n- Accepted: ${accepted}\n- Pending: ${pending}\n- Refused: ${refused}\n\n📬 CONTACT ACTIVITY:\n- Contacts made: ${contacted}\n- Total follow-ups: ${totalFollowups}\n- Average follow-ups/prospect: ${avgFollowups}\n- No response: ${noResponse}\n\n📋 PROSPECT BREAKDOWN:\n${prospectDetailEn}\n\n💡 ANALYSIS:\nConversion rate: ${rate}%. ${pending > 0 ? `We recommend following up with the ${pending} pending prospects within 48h.` : ''}\n\n🧭 GUIDANCE:\n${guidanceEn}\n\nBest regards,\nThe Tejiona AI Solutions Team\nsolutions@tejiona.com`
            }
          };

          const textToSend = translations[lang] || translations['fr'];

          const logoUrl = 'https://nter-prospect.vercel.app/logo.png';
          const kpiAccepted = lang === 'en' ? 'Accepted' : 'Acceptés';
          const kpiPending = lang === 'en' ? 'Pending' : 'En attente';
          const kpiRefused = lang === 'en' ? 'Refused' : 'Refusés';
          const reportTitle = lang === 'en' ? 'Prospecting Report' : 'Rapport de Prospection';
          const textLines = textToSend.body.split('\n');
          const htmlLines = textLines.map(line => {
            if (line.startsWith('📊') || line.startsWith('📬') || line.startsWith('📋') || line.startsWith('💡') || line.startsWith('🧭'))
              return `<h2 style="color:#6366f1;font-size:16px;margin:24px 0 12px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">${line}</h2>`;
            if (line.startsWith('- ') || line.startsWith('  - '))
              return `<div style="padding:4px 0 4px 16px;color:#334155;font-size:14px;">${line}</div>`;
            if (line.startsWith('→'))
              return `<div style="padding:6px 12px;margin:4px 0;background:#f1f5f9;border-left:3px solid #6366f1;border-radius:4px;font-size:13px;color:#475569;">${line}</div>`;
            if (line.trim() === '') return '<br/>';
            return `<p style="margin:4px 0;color:#334155;font-size:14px;line-height:1.6;">${line}</p>`;
          }).join('');

          const reportHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:32px;text-align:center;">
    <img src="${logoUrl}" alt="Tejiona AI Solutions" style="width:64px;height:64px;margin-bottom:12px;" />
    <h1 style="color:#ffffff;font-size:22px;margin:0;">T-Prospect</h1>
    <p style="color:#a5b4fc;font-size:13px;margin:4px 0 0;">${reportTitle} — ${c.name}</p>
  </div>
  <div style="padding:32px;">
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;color:#16a34a;font-weight:bold;text-transform:uppercase;">${kpiAccepted}</div><div style="font-size:28px;font-weight:bold;color:#16a34a;">${accepted}</div></div>
      <div style="flex:1;background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;color:#ca8a04;font-weight:bold;text-transform:uppercase;">${kpiPending}</div><div style="font-size:28px;font-weight:bold;color:#ca8a04;">${pending}</div></div>
      <div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;color:#dc2626;font-weight:bold;text-transform:uppercase;">${kpiRefused}</div><div style="font-size:28px;font-weight:bold;color:#dc2626;">${refused}</div></div>
    </div>
    ${htmlLines}
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px;text-align:center;">
    <img src="${logoUrl}" alt="Tejiona" style="width:32px;height:32px;margin-bottom:8px;opacity:0.6;" />
    <p style="color:#94a3b8;font-size:12px;margin:0;">Tejiona AI Solutions — solutions@tejiona.com</p>
  </div>
</div></body></html>`;

          await resend.emails.send({
            from: `TEJIONA AI Solutions <noreply@donotreply.tejiona.com>`,
            to: [c.email],
            subject: textToSend.sub,
            html: reportHtml,
            text: textToSend.body,
          });
          rapportsCount++;
          console.log(`[Cron-Local] Rapport envoyé à ${c.email} pour ${c.name}`);
        } catch (err) {
          console.error(`[Cron-Local] Erreur rapport client ${c.id}:`, err);
        }
      }
    }
  }
  console.log(`[Cron-Local] ${rapportsCount} rapports envoyés.`);
  console.log(`[Cron-Local] Terminé. Leads générés: ${leadsGenerated}, Relances: ${relancesCount}, Rapports: ${rapportsCount}`);
}

run().catch(err => { console.error("[Cron-Local] ERREUR CRITIQUE:", err); process.exit(1); });
