/* FICHIER: app/page.tsx */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { 
  LayoutDashboard, Users, Briefcase, FileText, Globe, 
  Play, Calendar, Link as LinkIcon, ShieldAlert, CheckCircle, XCircle, Clock,
  FileBarChart, X, Settings, PlusCircle, Loader2, Download, Send, CalendarDays,
  Database, Eye, Mail, UserPlus, Pencil, Trash, Wand2, Save, FileEdit, RefreshCw
} from 'lucide-react';

const PLANS: Record<string, { leads_per_month: number, price: string }> = {
  none: { leads_per_month: 0, price: '-' },
  starter: { leads_per_month: 500, price: '399$/mois' },
  growth: { leads_per_month: 1500, price: '899$/mois' },
};

const TRANSLATIONS = {
  fr: {
    nav_dashboard: "Tableau de bord", nav_clients: "Mes Clients", nav_legal: "Légal & CGU",
    btn_generate: "Générer Lead IA", btn_generating: "Génération...", client_info: "Informations Client", client_target: "Cible IA",
    launch_agent: "Lancer l'Agent IA pour", client_agenda: "Disponibilité (Agenda)", client_crm: "Liaisons Logicielles",
    client_knowledge: "Base de connaissances de l'IA", 
    table_prospect: "Prospect", table_contact1: "1er Contact", table_status: "Retour Prospect", table_followup: "Prochaine Relance", table_followup_count: "Relances", table_action: "Actions",
    status_pending: "En attente", status_contacted: "Contacté", status_followup: "Relancé", status_accepted: "Accepté", status_refused: "Refusé",
    legal_title: "Mentions Légales & CGU", 
    legal_1_title: "1. Acceptation des conditions", legal_1_text: "En accédant ou en utilisant notre plateforme, vous acceptez ces conditions. T-Prospect agit en tant qu'outil B2B pour automatiser la prospection.",
    legal_2_title: "2. Traitement des données et Sécurité", legal_2_text: "Nous traitons vos données conformément au RGPD et à la LPRPDE.",
    legal_3_title: "3. Collecte de données tierces (Scraping)", legal_3_text: "T-Prospect collecte des informations publiques via des fournisseurs. Vous vous engagez à utiliser ces informations dans le strict cadre légal B2B.",
    legal_4_title: "4. IA et Responsabilités", legal_4_text: "Les e-mails sont générés par IA. Vous êtes seul responsable du contenu généré, de sa vérification et de son envoi final.",
    legal_5_title: "5. Vos droits", legal_5_text: "Vous avez le droit d'accéder, de modifier ou de demander la suppression totale de vos données personnelles stockées sur notre plateforme.",
    legal_copyright: "© Copyright T-Prospect 2026. Tous droits réservés.",
    btn_report: "Rapport de Prospection", report_title: "Configuration", report_config_for: "Configuration pour :",
    report_manual: "Génération et envoi manuels du rapport de prospection", 
    report_auto: "Génération et envoi automatisés du rapport de prospection",
    report_freq: "Veuillez préciser la périodicité", freq_daily: "Quotidien", freq_weekly: "Hebdomadaire", freq_monthly: "Mensuel",
    report_time: "Heure d'envoi", report_day_week: "Jour de la semaine", report_day_month: "Jour du mois",
    day_mon: "Lundi", day_tue: "Mardi", day_wed: "Mercredi", day_thu: "Jeudi", day_fri: "Vendredi", day_sat: "Samedi", day_sun: "Dimanche",
    btn_save: "Enregistrer la configuration", btn_generate_now: "Générer le rapport", btn_cancel: "Annuler",
    btn_new_client: "+ Nouveau Client", add_client_title: "Ajouter un client", form_name: "Nom de l'entreprise",
    form_c_email: "Email du client (pour rapports)",
    form_website: "Site web du client", form_detect_target: "Détecter", form_detecting: "Analyse...",
    form_target: "Cible de prospection (IA)", form_agenda: "Lien de l'agenda", form_crm: "CRM utilisé",
    form_knowledge: "Contexte, descriptif, offres", btn_add: "Ajouter",
    generated_title: "Rapport de Campagne", kpi_total: "Total Prospects", kpi_accepted: "Rendez-vous", kpi_pending: "En attente", kpi_refused: "Refusés",
    btn_download_csv: "Télécharger (CSV)", btn_send_email: "Envoyer le rapport", 
    email_title: "Éditer le message IA", email_lang: "Langue du message", email_regenerate: "Régénérer avec l'IA", email_regenerating: "Régénération...",
    loading: "Chargement...", switch_lang: "Switch to English", company_label: "Entreprise :",
    agenda_label: "Agenda", crm_label: "CRM", no_context: "Aucun contexte renseigné.",
    no_prospects: "Aucun prospect généré.", client_label: "Client :", ai_analysis: "💡 Analyse IA",
    
    report_draft_intro: "Bonjour,\n\nVoici l'analyse détaillée de votre campagne de prospection pour",
    report_draft_stats: "📊 STATISTIQUES GÉNÉRALES :",
    report_draft_contacts: "📬 ACTIVITÉ DE CONTACT :",
    report_draft_contacts_made: "Contacts effectués (emails envoyés)",
    report_draft_total_followups: "Relances totales effectuées",
    report_draft_avg_followups: "Moyenne de relances par prospect",
    report_draft_no_response: "Prospects sans retour",
    report_draft_detail: "📋 DÉTAIL PAR PROSPECT :",
    report_draft_detail_header: "Prospect | Statut | Relances | Retour",
    report_draft_detail_separator: "---|---|---|---",
    report_draft_status_yes: "✅ Oui",
    report_draft_status_no: "❌ Non",
    report_draft_analysis: "💡 ANALYSE ET RECOMMANDATIONS :",
    report_draft_recommendation_1: "Le taux de conversion actuel est de",
    report_draft_recommendation_2: "%. Nous recommandons de relancer les",
    report_draft_recommendation_3: "prospects en attente dans les prochaines 48 heures pour maximiser les retours.",
    report_draft_guidance: "🧭 ORIENTATIONS :",
    report_draft_guidance_accepted: "→ Prospects ACCEPTÉS : Planifier un rendez-vous dans les 24h. Préparer une offre personnalisée et confirmer les disponibilités via l'agenda.",
    report_draft_guidance_refused: "→ Prospects REFUSÉS : Archiver et ne pas relancer. Analyser les motifs de refus pour ajuster le ciblage et le message de prospection.",
    report_draft_guidance_pending: "→ Prospects EN ATTENTE : Envoyer une relance personnalisée sous 48h. Varier l'approche (téléphone, email, LinkedIn) si plus de 2 relances déjà effectuées.",
    report_draft_outro: "Cordialement,\nL'équipe Tejiona AI Solutions\nsolutions@tejiona.com",
    kpi_contacted: "Contactés", kpi_total_followups: "Total Relances", kpi_no_response: "Sans retour",
    plan_label: "Forfait souscrit", plan_none: "Aucun forfait", plan_starter: "Starter", plan_growth: "Growth",
    plan_leads_month: "leads/mois", plan_leads_day: "leads/jour", plan_progress: "Progression ce mois",
    plan_quota_reached: "Quota mensuel atteint",
    form_plan: "Forfait de prospection",

    subject_label: "Sujet :", message_label: "Message :", btn_close: "Fermer", alert_config_saved: "Configuration enregistrée pour ce client !",
    alert_ai_error: "Impossible de contacter l'IA.",
    btn_manual_prospect: "+ Prospect Manuel", add_prospect_title: "Ajouter un Prospect",
    form_p_name: "Nom Complet", form_p_company: "Entreprise", form_p_email: "Email", form_p_phone: "Téléphone", form_p_address: "Adresse postale",
    form_p_contact: "Date du contact", form_p_followup: "Date de relance",
    edit_client_title: "Modifier le client", btn_edit: "Modifier", btn_delete: "Supprimer",
    confirm_del_client: "Supprimer ce client et tous ses prospects ? Cette action est irréversible.",
    confirm_del_prospect: "Supprimer ce prospect ?", edit_prospect_title: "Modifier le prospect",
    alert_no_email: "Ce prospect n'a pas d'adresse e-mail renseignée. Veuillez le modifier d'abord.",
    alert_email_sent: "E-mail envoyé avec succès !", alert_email_failed: "Échec de l'envoi.",
    btn_gen_msg: "Générer Message", btn_gen_followup: "Générer Relance",
    btn_save_msg: "Enregistrer", alert_client_no_email: "L'e-mail du client n'est pas renseigné.", alert_report_sent: "Rapport envoyé au client avec succès !",
    report_edit_label: "Contenu du rapport (Modifiable)", reports_sent_label: "Rapports envoyés"
  },
  en: {
    nav_dashboard: "Dashboard", nav_clients: "My Clients", nav_legal: "Legal & TOS",
    btn_generate: "Generate AI Lead", btn_generating: "Generating...", client_info: "Client Information", client_target: "AI Target",
    launch_agent: "Launch AI Agent for", client_agenda: "Availability (Calendar)", client_crm: "Software Integrations",
    client_knowledge: "AI Knowledge Base", 
    table_prospect: "Prospect", table_contact1: "1st Contact", table_status: "Prospect Feedback", table_followup: "Next Follow-up", table_followup_count: "Follow-ups", table_action: "Actions",
    status_pending: "Pending", status_contacted: "Contacted", status_followup: "Follow-up", status_accepted: "Accepted", status_refused: "Refused",
    legal_title: "Legal Notices & TOS", 
    legal_1_title: "1. Acceptance of Terms", legal_1_text: "By accessing or using our platform, you agree to these terms. T-Prospect acts as a B2B tool to automate prospecting.",
    legal_2_title: "2. Data Processing and Security", legal_2_text: "We process data in accordance with GDPR and PIPEDA.",
    legal_3_title: "3. Third-Party Data Collection", legal_3_text: "T-Prospect collects public info from service providers. You agree to use this strictly within B2B legal frameworks.",
    legal_4_title: "4. AI and Liability", legal_4_text: "Emails are AI-generated. You are solely responsible for the generated content, its verification, and final transmission.",
    legal_5_title: "5. Your Rights", legal_5_text: "You have the right to access, correct, or request the deletion of all your personal data stored on our platform.",
    legal_copyright: "© Copyright T-Prospect 2026. All rights reserved.",
    btn_report: "Prospecting Report", report_title: "Configuration", report_config_for: "Configuration for:",
    report_manual: "Manual generation and sending of the prospecting report", 
    report_auto: "Automated generation and sending of the prospecting report",
    report_freq: "Please specify the frequency", freq_daily: "Daily", freq_weekly: "Weekly", freq_monthly: "Monthly",
    report_time: "Sending time", report_day_week: "Day of the week", report_day_month: "Day of the month",
    day_mon: "Monday", day_tue: "Tuesday", day_wed: "Wednesday", day_thu: "Thursday", day_fri: "Friday", day_sat: "Saturday", day_sun: "Sunday",
    btn_save: "Save configuration", btn_generate_now: "Generate report", btn_cancel: "Cancel",
    btn_new_client: "+ New Client", add_client_title: "Add a Client", form_name: "Company Name",
    form_c_email: "Client Email (for reports)", 
    form_website: "Client Website", form_detect_target: "Detect", form_detecting: "Analyzing...",
    form_target: "Prospecting Target", form_agenda: "Calendar Link", form_crm: "CRM Used", 
    form_knowledge: "Context, offers", btn_add: "Add",
    generated_title: "Campaign Report", kpi_total: "Total Prospects", kpi_accepted: "Meetings", kpi_pending: "Pending", kpi_refused: "Refused",
    btn_download_csv: "Download (CSV)", btn_send_email: "Send Report", 
    email_title: "Edit AI Message", email_lang: "Message language", email_regenerate: "Regenerate with AI", email_regenerating: "Regenerating...",
    loading: "Loading...", switch_lang: "Passer en Français", company_label: "Company:",
    agenda_label: "Calendar", crm_label: "CRM", no_context: "No context provided.",
    no_prospects: "No prospects generated.", client_label: "Client:", ai_analysis: "💡 AI Analysis",
    
    report_draft_intro: "Hello,\n\nHere is the detailed analysis of your prospecting campaign for",
    report_draft_stats: "📊 GENERAL STATISTICS:",
    report_draft_contacts: "📬 CONTACT ACTIVITY:",
    report_draft_contacts_made: "Contacts made (emails sent)",
    report_draft_total_followups: "Total follow-ups sent",
    report_draft_avg_followups: "Average follow-ups per prospect",
    report_draft_no_response: "Prospects with no response",
    report_draft_detail: "📋 PROSPECT BREAKDOWN:",
    report_draft_detail_header: "Prospect | Status | Follow-ups | Response",
    report_draft_detail_separator: "---|---|---|---",
    report_draft_status_yes: "✅ Yes",
    report_draft_status_no: "❌ No",
    report_draft_analysis: "💡 ANALYSIS AND RECOMMENDATIONS:",
    report_draft_recommendation_1: "The current conversion rate is",
    report_draft_recommendation_2: "%. We recommend following up with the",
    report_draft_recommendation_3: "pending prospects within the next 48 hours to maximize responses.",
    report_draft_guidance: "🧭 GUIDANCE:",
    report_draft_guidance_accepted: "→ ACCEPTED prospects: Schedule a meeting within 24h. Prepare a tailored offer and confirm availability via calendar.",
    report_draft_guidance_refused: "→ REFUSED prospects: Archive and do not follow up again. Analyze refusal reasons to adjust targeting and messaging.",
    report_draft_guidance_pending: "→ PENDING prospects: Send a personalized follow-up within 48h. Vary the approach (phone, email, LinkedIn) if more than 2 follow-ups have already been sent.",
    report_draft_outro: "Best regards,\nThe Tejiona AI Solutions Team\nsolutions@tejiona.com",
    kpi_contacted: "Contacted", kpi_total_followups: "Total Follow-ups", kpi_no_response: "No Response",
    plan_label: "Subscribed Plan", plan_none: "No plan", plan_starter: "Starter", plan_growth: "Growth",
    plan_leads_month: "leads/month", plan_leads_day: "leads/day", plan_progress: "Progress this month",
    plan_quota_reached: "Monthly quota reached",
    form_plan: "Prospecting Plan",

    subject_label: "Subject:", message_label: "Message:", btn_close: "Close", alert_config_saved: "Client configuration saved!",
    alert_ai_error: "Unable to contact AI.",
    btn_manual_prospect: "+ Manual Prospect", add_prospect_title: "Add Prospect",
    form_p_name: "Full Name", form_p_company: "Company", form_p_email: "Email", form_p_phone: "Phone", form_p_address: "Postal Address",
    form_p_contact: "Contact Date", form_p_followup: "Follow-up Date",
    edit_client_title: "Edit Client", btn_edit: "Edit", btn_delete: "Delete",
    confirm_del_client: "Delete this client and all their prospects? This cannot be undone.",
    confirm_del_prospect: "Delete this prospect?", edit_prospect_title: "Edit Prospect",
    alert_no_email: "This prospect has no email address. Please edit it first.",
    alert_email_sent: "Email sent successfully!", alert_email_failed: "Failed to send email.",
    btn_gen_msg: "Gen Message", btn_gen_followup: "Gen Follow-up",
    btn_save_msg: "Save", alert_client_no_email: "Client email is missing.", alert_report_sent: "Report sent successfully!",
    report_edit_label: "Report Content (Editable)", reports_sent_label: "Reports sent"
  }
};

export default function NterPlatform() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr');
  const [activeTab, setActiveTab] = useState<'clients' | 'legal'>('clients');
  const t = TRANSLATIONS[lang];

  const [clients, setClients] = useState<any[]>([]);
  const [activeClient, setActiveClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({ id: null, name: '', email: '', website: '', target: '', agendaUrl: '', crm: '', knowledge_base: '', plan: 'none' });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLead, setIsGeneratingLead] = useState(false);
  const [isDetectingTarget, setIsDetectingTarget] = useState(false);

  const [showAddProspectModal, setShowAddProspectModal] = useState(false);
  const [showEditProspectModal, setShowEditProspectModal] = useState(false);
  const [prospectFormData, setProspectFormData] = useState({ id: null, name: '', company: '', email: '', phone: '', address: '', firstContact: new Date().toISOString().split('T')[0], followUp: '', status: 'pending' });

  const [selectedEmail, setSelectedEmail] = useState<{id: string, subject: string, body: string} | null>(null);
  const [emailEditLang, setEmailEditLang] = useState<'fr' | 'en'>('fr');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [generatingMessageId, setGeneratingMessageId] = useState<string | null>(null);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const startEditing = (field: string, value: string) => { setEditingField(field); setEditingValue(value || ''); };
  const cancelEditing = () => { setEditingField(null); setEditingValue(''); };
  const saveInlineField = async (field: string) => {
    if (!activeClient) return;
    const dbField = field === 'agendaUrl' ? 'agendaurl' : field;
    let { data, error } = await supabase.from('clients').update({ [dbField]: editingValue || null }).eq('id', activeClient.id).select('*, prospects(*)');
    if (error && dbField === 'website') { cancelEditing(); return; }
    if (!error && data) { setClients(clients.map(c => c.id === data[0].id ? data[0] : c)); setActiveClient(data[0]); }
    cancelEditing();
  };

  const [showReportConfigModal, setShowReportConfigModal] = useState(false);
  const [reportMode, setReportMode] = useState<'manual' | 'auto'>('manual');
  const [reportFreq, setReportFreq] = useState('weekly');
  const [reportTime, setReportTime] = useState('08:00');
  const [reportDayOfWeek, setReportDayOfWeek] = useState('1'); 
  const [reportDayOfMonth, setReportDayOfMonth] = useState('1'); 
  
  const [showGeneratedReport, setShowGeneratedReport] = useState(false);
  const [reportStats, setReportStats] = useState({ total: 0, accepted: 0, pending: 0, refused: 0, contacted: 0, totalFollowups: 0, noResponse: 0 });
  const [reportEmailBody, setReportEmailBody] = useState(""); 
  const [isSendingReport, setIsSendingReport] = useState(false); 

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('clients').select('*, prospects(*)').order('created_at', { referencedTable: 'prospects', ascending: false });
    if (!error && data) { setClients(data); if (data.length > 0 && !activeClient) setActiveClient(data[0]); }
    setIsLoading(false);
  };

  const handleDetectTarget = async () => {
    if (!clientFormData.website) return;
    setIsDetectingTarget(true);
    try {
      const res = await fetch('/api/detect-target', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: clientFormData.website, lang })
      });
      const data = await res.json();
      if (data.target) setClientFormData({ ...clientFormData, target: data.target });
    } catch { /* ignore */ } finally { setIsDetectingTarget(false); }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true);
    const payload: Record<string, any> = {
      name: clientFormData.name, email: clientFormData.email, target: clientFormData.target,
      agendaurl: clientFormData.agendaUrl, crm: clientFormData.crm, knowledge_base: clientFormData.knowledge_base, plan: clientFormData.plan
    };
    if (clientFormData.website) payload.website = clientFormData.website;

    if (clientFormData.id) {
        let { data, error } = await supabase.from('clients').update(payload).eq('id', clientFormData.id).select('*, prospects(*)');
        if (error?.message?.includes('website')) {
          delete payload.website;
          ({ data, error } = await supabase.from('clients').update(payload).eq('id', clientFormData.id).select('*, prospects(*)'));
        }
        if (error) { console.error('Erreur update client:', error); alert('Erreur: ' + error.message); }
        else if (data) { setClients(clients.map(c => c.id === data[0].id ? data[0] : c)); setActiveClient(data[0]); setShowEditClientModal(false); }
    } else {
        let { data, error } = await supabase.from('clients').insert([payload]).select('*, prospects(*)');
        if (error?.message?.includes('website')) {
          delete payload.website;
          ({ data, error } = await supabase.from('clients').insert([payload]).select('*, prospects(*)'));
        }
        if (error) { console.error('Erreur insert client:', error); alert('Erreur: ' + error.message); }
        else if (data) { setClients([...clients, data[0]]); setActiveClient(data[0]); setShowAddClientModal(false); }
    }
    setClientFormData({ id: null, name: '', email: '', website: '', target: '', agendaUrl: '', crm: '', knowledge_base: '', plan: 'none' }); setIsSaving(false);
  };

  const handleDeleteClient = async (id: string) => {
      if (window.confirm(t.confirm_del_client)) {
          await supabase.from('clients').delete().eq('id', id); setClients(clients.filter(c => c.id !== id)); setActiveClient(null);
      }
  };

  const handleSaveProspect = async (e: React.FormEvent) => {
    e.preventDefault(); if (!activeClient) return; setIsSaving(true);
    const prospectName = prospectFormData.company ? `${prospectFormData.name.split(' (')[0]} (${prospectFormData.company})` : prospectFormData.name;
    if (prospectFormData.id) {
        const { data, error } = await supabase.from('prospects').update({
            name: prospectName, email: prospectFormData.email, phone: prospectFormData.phone, address: prospectFormData.address, firstcontact: prospectFormData.firstContact, status: prospectFormData.status, followup: prospectFormData.followUp
        }).eq('id', prospectFormData.id).select('*');
        if (!error && data) {
            const updatedClient = { ...activeClient, prospects: activeClient.prospects.map((p: any) => p.id === data[0].id ? data[0] : p) };
            setActiveClient(updatedClient); setClients(clients.map(c => c.id === activeClient.id ? updatedClient : c)); setShowEditProspectModal(false);
        }
    } else {
        const { data, error } = await supabase.from('prospects').insert([
        { client_id: activeClient.id, name: prospectName, email: prospectFormData.email, phone: prospectFormData.phone, address: prospectFormData.address, firstcontact: prospectFormData.firstContact, status: prospectFormData.status, followup: prospectFormData.followUp }
        ]).select('*');
        if (!error && data) {
            const updatedClient = { ...activeClient, prospects: [data[0], ...(activeClient.prospects || [])] };
            setActiveClient(updatedClient); setClients(clients.map(c => c.id === activeClient.id ? updatedClient : c)); setShowAddProspectModal(false);
        }
    }
    setProspectFormData({ id: null, name: '', company: '', email: '', phone: '', address: '', firstContact: new Date().toISOString().split('T')[0], followUp: '', status: 'pending' }); setIsSaving(false);
  };

  const handleDeleteProspect = async (id: string) => {
      if (window.confirm(t.confirm_del_prospect)) {
          await supabase.from('prospects').delete().eq('id', id);
          const updatedClient = { ...activeClient, prospects: activeClient.prospects.filter((p: any) => p.id !== id) };
          setActiveClient(updatedClient); setClients(clients.map(c => c.id === activeClient.id ? updatedClient : c));
      }
  };

  const handleGenerateLead = async () => {
    if (!activeClient) return; setIsGeneratingLead(true);
    try {
      const existingNames = activeClient.prospects?.map((p: any) => p.name) || [];
      const response = await fetch('/api/agent/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: activeClient.target, clientName: activeClient.name, knowledgeBase: activeClient.knowledge_base, existingProspects: existingNames, lang })
      });
      const aiData = await response.json();
      if (aiData.newLead) {
        const leadName = `${aiData.newLead.name} (${aiData.newLead.company})`;
        const today = new Date().toISOString().split('T')[0];
        const followUpDate = new Date();
        const daysAhead = 5 + Math.floor(Math.random() * 5);
        followUpDate.setDate(followUpDate.getDate() + daysAhead);
        if (followUpDate.getDay() === 0) followUpDate.setDate(followUpDate.getDate() + 1);
        if (followUpDate.getDay() === 6) followUpDate.setDate(followUpDate.getDate() + 2);
        const followUpStr = followUpDate.toISOString().split('T')[0];

        const { data: dbData, error } = await supabase.from('prospects').insert([
          { 
            client_id: activeClient.id, name: leadName, email: aiData.newLead.email || "", phone: aiData.newLead.phone || "", address: aiData.newLead.address || "", 
            firstcontact: today, status: 'pending', followup: followUpStr, email_subject: aiData.newLead.email_subject, email_body: aiData.newLead.email_body 
          }
        ]).select('*'); 
        if (!error && dbData && dbData.length > 0) {
          const updatedClient = { ...activeClient, prospects: [dbData[0], ...(activeClient.prospects || [])] };
          setActiveClient(updatedClient); setClients(clients.map(c => c.id === activeClient.id ? updatedClient : c));
        }
      }
    } catch (e) { alert(t.alert_ai_error); } finally { setIsGeneratingLead(false); }
  };

  const handleGenerateMessageForProspect = async (prospect: any, isFollowUp: boolean) => {
    setGeneratingMessageId(prospect.id);
    try {
      let cleanName = prospect.name; let cleanCompany = prospect.name;
      if(prospect.name.includes('(')) { const parts = prospect.name.split(' ('); cleanName = parts[0]; cleanCompany = parts[1].replace(')', ''); }

      const response = await fetch('/api/agent/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualName: cleanName, manualCompany: cleanCompany, clientName: activeClient.name, knowledgeBase: activeClient.knowledge_base, isFollowUp, lang })
      });
      const aiData = await response.json();

      if (aiData.newLead) {
        const { data, error } = await supabase.from('prospects').update({
            email_subject: aiData.newLead.email_subject, email_body: aiData.newLead.email_body
        }).eq('id', prospect.id).select('*');
        if (!error && data) {
            const updatedClient = { ...activeClient, prospects: activeClient.prospects.map((p: any) => p.id === data[0].id ? data[0] : p) };
            setActiveClient(updatedClient); setClients(clients.map(c => c.id === activeClient.id ? updatedClient : c));
        }
      }
    } catch (e) { alert(t.alert_ai_error); } finally { setGeneratingMessageId(null); }
  };

  const handleRegenerateEmail = async () => {
    if (!selectedEmail || !activeClient) return;
    const prospect = activeClient.prospects?.find((p: any) => p.id === selectedEmail.id);
    if (!prospect) return;
    setIsRegenerating(true);
    try {
      let cleanName = prospect.name; let cleanCompany = prospect.name;
      if (prospect.name.includes('(')) { const parts = prospect.name.split(' ('); cleanName = parts[0]; cleanCompany = parts[1].replace(')', ''); }
      const isFollowUp = (prospect.followup_count || 0) > 0;
      const response = await fetch('/api/agent/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualName: cleanName, manualCompany: cleanCompany, clientName: activeClient.name, knowledgeBase: activeClient.knowledge_base, isFollowUp, lang: emailEditLang })
      });
      const aiData = await response.json();
      if (aiData.newLead) {
        setSelectedEmail({ ...selectedEmail, subject: aiData.newLead.email_subject, body: aiData.newLead.email_body });
      }
    } catch { alert(t.alert_ai_error); } finally { setIsRegenerating(false); }
  };

  const handleUpdateEmail = async () => {
    if (!selectedEmail || !activeClient) return; setIsSaving(true);
    const { data, error } = await supabase.from('prospects')
      .update({ email_subject: selectedEmail.subject, email_body: selectedEmail.body }).eq('id', selectedEmail.id).select('*');

    if (!error && data) {
      const updatedClient = { ...activeClient, prospects: activeClient.prospects.map((p: any) => p.id === selectedEmail.id ? data[0] : p) };
      setActiveClient(updatedClient); setClients(clients.map(c => c.id === activeClient.id ? updatedClient : c)); setSelectedEmail(null); 
    }
    setIsSaving(false);
  };

  const handleSendEmail = async (prospect: any) => {
    if (!prospect.email) { alert(t.alert_no_email); openEditProspect(prospect); return; }
    setSendingEmailId(prospect.id);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: prospect.email, subject: prospect.email_subject, text: prospect.email_body, senderName: activeClient.name })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const newCount = (prospect.followup_count || 0) + 1;
        let newStatus: string;
        if (newCount === 1) { newStatus = 'contacted'; }
        else { const followupNum = newCount - 1; newStatus = followupNum > 5 ? 'refused' : `followup_${followupNum}`; }
        await supabase.from('prospects').update({ followup_count: newCount, status: newStatus }).eq('id', prospect.id);
        const updatedClient = { ...activeClient, prospects: activeClient.prospects.map((p: any) => p.id === prospect.id ? { ...p, followup_count: newCount, status: newStatus } : p) };
        setActiveClient(updatedClient); setClients(clients.map((c: any) => c.id === activeClient.id ? updatedClient : c));
        alert(t.alert_email_sent);
      } else {
        const errMsg = data.error || t.alert_email_failed;
        alert(typeof errMsg === 'string' ? errMsg : t.alert_email_failed);
        if (response.status === 422) openEditProspect(prospect);
      }
    } catch (error) { alert(t.alert_email_failed); } finally { setSendingEmailId(null); }
  };

  const openEditProspect = (prospect: any) => {
      let cleanName = prospect.name; let cleanCompany = "";
      if(prospect.name.includes('(')) { const parts = prospect.name.split(' ('); cleanName = parts[0]; cleanCompany = parts[1].replace(')', ''); }
      setProspectFormData({ id: prospect.id, name: cleanName, company: cleanCompany, email: prospect.email || '', phone: prospect.phone || '', address: prospect.address || '', firstContact: prospect.firstcontact || prospect.firstContact || '', followUp: prospect.followup || prospect.followUp || '', status: prospect.status });
      setShowEditProspectModal(true);
  };

  const openReportConfig = () => {
    if (activeClient) {
      setReportMode(activeClient.report_mode || 'manual');
      setReportFreq(activeClient.report_freq || 'weekly');
      setReportTime(activeClient.report_time || '08:00');
      setReportDayOfWeek(activeClient.report_day_week || '1');
      setReportDayOfMonth(activeClient.report_day_month || '1');
    }
    setShowReportConfigModal(true);
  };

  const handleSaveReportConfig = async () => {
    if (!activeClient) return;
    setIsSaving(true);
    
    // On sauvegarde aussi la langue "lang" pour que l'automatisation sache quoi utiliser
    const { data, error } = await supabase.from('clients').update({
        report_mode: reportMode, report_freq: reportFreq, report_time: reportTime, report_day_week: reportDayOfWeek, report_day_month: reportDayOfMonth, report_lang: lang
    }).eq('id', activeClient.id).select('*, prospects(*)');

    if (!error && data) {
        setClients(clients.map(c => c.id === data[0].id ? data[0] : c)); setActiveClient(data[0]);
        setShowReportConfigModal(false);
        if (reportMode === 'manual') {
            generateAndShowReportData(data[0]);
        } else {
            alert(t.alert_config_saved);
        }
    }
    setIsSaving(false);
  };

  const generateAndShowReportData = (client: any) => {
    const prospects = client.prospects || [];
    const total = prospects.length;
    const accepted = prospects.filter((p: any) => p.status === 'accepted').length;
    const pending = prospects.filter((p: any) => p.status === 'pending').length;
    const refused = prospects.filter((p: any) => p.status === 'refused').length;
    const contacted = prospects.filter((p: any) => p.status === 'contacted' || p.status?.startsWith('followup_')).length;
    const totalFollowups = prospects.reduce((sum: number, p: any) => sum + (p.followup_count || 0), 0);
    const noResponse = prospects.filter((p: any) => (p.status === 'contacted' || p.status?.startsWith('followup_')) && p.status !== 'accepted' && p.status !== 'refused').length;
    const avgFollowups = total > 0 ? (totalFollowups / total).toFixed(1) : '0';

    setReportStats({ total, accepted, pending, refused, contacted, totalFollowups, noResponse });

    const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

    const prospectLines = prospects.map((p: any) => {
      const fc = p.followup_count || 0;
      const statusLabel = p.status === 'accepted' ? t.kpi_accepted : p.status === 'refused' ? t.kpi_refused : p.status === 'contacted' ? t.status_contacted : p.status?.startsWith('followup_') ? `${t.status_followup} (${p.status.split('_')[1]})` : t.status_pending;
      const hasResponse = p.status === 'accepted' || p.status === 'refused' ? t.report_draft_status_yes : t.report_draft_status_no;
      return `${p.name} | ${statusLabel} | ${fc} | ${hasResponse}`;
    }).join('\n');

    const guidanceParts = [];
    if (accepted > 0) guidanceParts.push(t.report_draft_guidance_accepted);
    if (refused > 0) guidanceParts.push(t.report_draft_guidance_refused);
    if (pending > 0) guidanceParts.push(t.report_draft_guidance_pending);

    const draft = `${t.report_draft_intro} ${client.name} :\n\n` +
      `${t.report_draft_stats}\n- ${t.kpi_total} : ${total}\n- ${t.kpi_accepted} : ${accepted}\n- ${t.kpi_pending} : ${pending}\n- ${t.kpi_refused} : ${refused}\n\n` +
      `${t.report_draft_contacts}\n- ${t.report_draft_contacts_made} : ${contacted}\n- ${t.report_draft_total_followups} : ${totalFollowups}\n- ${t.report_draft_avg_followups} : ${avgFollowups}\n- ${t.report_draft_no_response} : ${noResponse}\n\n` +
      `${t.report_draft_detail}\n${t.report_draft_detail_header}\n${t.report_draft_detail_separator}\n${prospectLines}\n\n` +
      `${t.report_draft_analysis}\n${t.report_draft_recommendation_1} ${rate}${t.report_draft_recommendation_2} ${pending} ${t.report_draft_recommendation_3}\n\n` +
      `${t.report_draft_guidance}\n${guidanceParts.join('\n')}\n\n` +
      `${t.report_draft_outro}`;

    setReportEmailBody(draft);
    setShowGeneratedReport(true);
  };

  const downloadCSV = () => { 
    const prospects = activeClient.prospects || [];
    const headers = ["Nom du Prospect", "Email", "Téléphone", "Adresse", "1er Contact", "Statut", "Prochaine Relance", "Nb Relances"];
    const rows = prospects.map((p: any) => `"${p.name}","${p.email || ''}","${p.phone || ''}","${p.address || ''}","${p.firstcontact || p.firstContact || ''}","${p.status}","${p.followup || p.followUp || ''}","${p.followup_count || 0}"`);
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n"); 
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Rapport_${activeClient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const buildReportHtml = (textBody: string, clientName: string) => {
    const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : 'https://nter-prospect.vercel.app/logo.png';
    const lines = textBody.split('\n');
    const htmlLines = lines.map(line => {
      if (line.startsWith('📊') || line.startsWith('📬') || line.startsWith('📋') || line.startsWith('💡') || line.startsWith('🧭'))
        return `<h2 style="color:#6366f1;font-size:16px;margin:24px 0 12px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">${line}</h2>`;
      if (line.startsWith('- ') || line.startsWith('  - '))
        return `<div style="padding:4px 0 4px 16px;color:#334155;font-size:14px;">${line}</div>`;
      if (line.startsWith('→'))
        return `<div style="padding:6px 12px;margin:4px 0;background:#f1f5f9;border-left:3px solid #6366f1;border-radius:4px;font-size:13px;color:#475569;">${line}</div>`;
      if (line.includes('---|'))
        return '';
      if (line.trim() === '')
        return '<br/>';
      return `<p style="margin:4px 0;color:#334155;font-size:14px;line-height:1.6;">${line}</p>`;
    }).join('');

    return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
  <div style="background:linear-gradient(135deg,#1e1b4b,#312e81);padding:32px;text-align:center;">
    <img src="${logoUrl}" alt="Tejiona AI Solutions" style="width:64px;height:64px;margin-bottom:12px;" />
    <h1 style="color:#ffffff;font-size:22px;margin:0;">T-Prospect</h1>
    <p style="color:#a5b4fc;font-size:13px;margin:4px 0 0;">${lang === 'en' ? 'Prospecting Report' : 'Rapport de Prospection'} — ${clientName}</p>
  </div>
  <div style="padding:32px;">
    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;color:#16a34a;font-weight:bold;text-transform:uppercase;">${t.kpi_accepted}</div><div style="font-size:28px;font-weight:bold;color:#16a34a;">${reportStats.accepted}</div></div>
      <div style="flex:1;background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;color:#ca8a04;font-weight:bold;text-transform:uppercase;">${t.kpi_pending}</div><div style="font-size:28px;font-weight:bold;color:#ca8a04;">${reportStats.pending}</div></div>
      <div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;text-align:center;"><div style="font-size:11px;color:#dc2626;font-weight:bold;text-transform:uppercase;">${t.kpi_refused}</div><div style="font-size:28px;font-weight:bold;color:#dc2626;">${reportStats.refused}</div></div>
    </div>
    ${htmlLines}
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px;text-align:center;">
    <img src="${logoUrl}" alt="Tejiona" style="width:32px;height:32px;margin-bottom:8px;opacity:0.6;" />
    <p style="color:#94a3b8;font-size:12px;margin:0;">Tejiona AI Solutions — solutions@tejiona.com</p>
  </div>
</div></body></html>`;
  };

  const handleSendReportToClient = async () => {
    if (!activeClient.email) { alert(t.alert_client_no_email); return; }
    setIsSendingReport(true);
    try {
        const html = buildReportHtml(reportEmailBody, activeClient.name);
        const response = await fetch('/api/send-email', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: activeClient.email, subject: `${t.generated_title} - ${activeClient.name}`, html, text: reportEmailBody, senderName: 'TEJIONA AI Solutions' })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            const newCount = (activeClient.reports_sent || 0) + 1;
            await supabase.from('clients').update({ reports_sent: newCount }).eq('id', activeClient.id);
            const updatedClient = { ...activeClient, reports_sent: newCount };
            setActiveClient(updatedClient);
            setClients(clients.map((c: any) => c.id === activeClient.id ? updatedClient : c));
            alert(t.alert_report_sent); setShowGeneratedReport(false);
        } else { alert(t.alert_email_failed); }
    } catch (err) { alert(t.alert_email_failed); } finally { setIsSendingReport(false); }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans flex flex-col md:flex-row relative">
      <aside className="w-full md:w-64 border-r border-slate-700 bg-slate-800/50 p-4 flex flex-col z-10">
        <div className="flex items-center gap-3 mb-8 px-2 mt-4"><img src="/logo.png" alt="Tejiona AI Solutions" className="w-10 h-10 rounded-lg object-contain" /><h1 className="text-xl font-bold tracking-tight">T-<span className="text-indigo-400">Prospect</span></h1></div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'clients' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}><Briefcase size={18} /> {t.nav_clients}</button>
          <button onClick={() => setActiveTab('legal')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'legal' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}><FileText size={18} /> {t.nav_legal}</button>
        </nav>
        <div className="mt-auto border-t border-slate-700 pt-4"><button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-600 transition"><Globe size={16} /> {t.switch_lang}</button></div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto z-10">
        {activeTab === 'clients' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex gap-4 overflow-x-auto pb-4 border-b border-slate-700 items-center">
              {isLoading ? <span className="text-slate-400 text-sm flex items-center gap-2"><Loader2 size={16} className="animate-spin"/> {t.loading}</span> : clients.map(client => (<button key={client.id} onClick={() => setActiveClient(client)} className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap ${activeClient?.id === client.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}>{client.name}</button>))}
              <button onClick={() => { setClientFormData({ id: null, name: '', email: '', website: '', target: '', agendaUrl: '', crm: '', knowledge_base: '', plan: 'none' }); setShowAddClientModal(true); }} className="px-4 py-2 rounded-full text-sm font-semibold border border-dashed border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 whitespace-nowrap"><PlusCircle size={16} /> {t.btn_new_client}</button>
            </div>

            {activeClient && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col relative group">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-50 hover:opacity-100 transition-opacity">
                        <button onClick={() => { setClientFormData({ id: activeClient.id, name: activeClient.name || '', email: activeClient.email || '', website: activeClient.website || '', target: activeClient.target || '', agendaUrl: activeClient.agendaurl || activeClient.agendaUrl || '', crm: activeClient.crm || '', knowledge_base: activeClient.knowledge_base || '', plan: activeClient.plan || 'none' }); setShowEditClientModal(true); }} className="p-2 bg-slate-700 hover:bg-indigo-600 rounded text-white" title={t.btn_edit}><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteClient(activeClient.id)} className="p-2 bg-slate-700 hover:bg-red-600 rounded text-white" title={t.btn_delete}><Trash size={14} /></button>
                    </div>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Briefcase size={18} className="text-indigo-400"/> {t.client_info}</h2>
                    <div className="space-y-3 pr-16">
                      <div className="text-sm flex items-center gap-1"><span className="text-slate-400">{t.company_label}</span> {editingField === 'name' ? <span className="flex items-center gap-1 flex-1"><input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveInlineField('name'); if (e.key === 'Escape') cancelEditing(); }} onBlur={() => saveInlineField('name')} className="bg-slate-900 border border-indigo-500 text-white rounded px-2 py-0.5 text-sm flex-1 outline-none" /></span> : <span className="cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => startEditing('name', activeClient.name)}>{activeClient.name}</span>}</div>
                      <div className="text-sm flex items-center gap-1"><span className="text-slate-400">Email :</span> {editingField === 'email' ? <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveInlineField('email'); if (e.key === 'Escape') cancelEditing(); }} onBlur={() => saveInlineField('email')} className="bg-slate-900 border border-indigo-500 text-white rounded px-2 py-0.5 text-sm flex-1 outline-none" /> : <span className="cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => startEditing('email', activeClient.email)}>{activeClient.email || <span className="italic text-slate-500">—</span>}</span>}</div>
                      <div className="text-sm flex items-center gap-1"><span className="text-slate-400">{t.form_website} :</span> {editingField === 'website' ? <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveInlineField('website'); if (e.key === 'Escape') cancelEditing(); }} onBlur={() => saveInlineField('website')} className="bg-slate-900 border border-indigo-500 text-white rounded px-2 py-0.5 text-sm flex-1 outline-none" /> : <span className="cursor-pointer hover:text-cyan-300 transition-colors" onClick={() => startEditing('website', activeClient.website)}>{activeClient.website ? <a href={activeClient.website.startsWith('http') ? activeClient.website : `https://${activeClient.website}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline" onClick={e => e.stopPropagation()}>{activeClient.website}</a> : <span className="italic text-slate-500">—</span>}</span>}</div>
                      <div className="text-sm flex items-center gap-1"><span className="text-slate-400">{t.client_target} :</span> {editingField === 'target' ? <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveInlineField('target'); if (e.key === 'Escape') cancelEditing(); }} onBlur={() => saveInlineField('target')} className="bg-slate-900 border border-indigo-500 text-white rounded px-2 py-0.5 text-sm flex-1 outline-none" /> : <span className="cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => startEditing('target', activeClient.target)}>{activeClient.target || <span className="italic text-slate-500">—</span>}</span>}</div>
                      <p className="text-sm flex items-center gap-2"><FileBarChart size={14} className="text-indigo-400" /> <span className="text-slate-400">{t.reports_sent_label} :</span> <span className="font-semibold text-indigo-300">{activeClient.reports_sent || 0}</span></p>
                      {(() => {
                        const clientPlan = PLANS[activeClient.plan] || PLANS.none;
                        const planName = activeClient.plan === 'growth' ? t.plan_growth : activeClient.plan === 'starter' ? t.plan_starter : t.plan_none;
                        const now = new Date();
                        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                        const leadsThisMonth = (activeClient.prospects || []).filter((p: any) => (p.firstcontact || '') >= monthStart).length;
                        const monthlyQuota = clientPlan.leads_per_month;
                        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                        const dailyQuota = monthlyQuota > 0 ? Math.ceil(monthlyQuota / daysInMonth) : 0;
                        const pct = monthlyQuota > 0 ? Math.min(100, Math.round((leadsThisMonth / monthlyQuota) * 100)) : 0;
                        return (
                          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 mt-1">
                            <div className="text-sm flex items-center gap-2 mb-2"><Globe size={14} className="text-cyan-400" /> <span className="text-slate-400">{t.plan_label} :</span> {editingField === 'plan' ? <select autoFocus value={editingValue} onChange={async e => { const val = e.target.value; setEditingValue(val); const { data, error } = await supabase.from('clients').update({ plan: val }).eq('id', activeClient.id).select('*, prospects(*)'); if (!error && data) { setClients(clients.map(c => c.id === data[0].id ? data[0] : c)); setActiveClient(data[0]); } cancelEditing(); }} onBlur={() => cancelEditing()} className="bg-slate-900 border border-indigo-500 text-white rounded px-2 py-0.5 text-sm outline-none"><option value="none">{t.plan_none}</option><option value="starter">{t.plan_starter}</option><option value="growth">{t.plan_growth}</option></select> : <span className="font-bold text-cyan-300 cursor-pointer hover:text-cyan-200 transition-colors" onClick={() => startEditing('plan', activeClient.plan || 'none')}>{planName}</span>} {monthlyQuota > 0 && <span className="text-xs text-slate-500">({clientPlan.price})</span>}</div>
                            {monthlyQuota > 0 && (
                              <>
                                <div className="flex justify-between text-xs text-slate-400 mb-1">
                                  <span>{monthlyQuota} {t.plan_leads_month} · {dailyQuota} {t.plan_leads_day}</span>
                                  <span>{t.plan_progress} : {leadsThisMonth}/{monthlyQuota}</span>
                                </div>
                                <div className="w-full bg-slate-700 rounded-full h-2">
                                  <div className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }} />
                                </div>
                                {pct >= 100 && <p className="text-xs text-emerald-400 mt-1 font-medium">{t.plan_quota_reached}</p>}
                              </>
                            )}
                          </div>
                        );
                      })()}
                      <div className="pt-3 border-t border-slate-700">
                        <div className="text-sm flex items-center gap-2"><Calendar size={14} className="text-blue-400"/> <span className="text-slate-400">{t.client_agenda} :</span> {editingField === 'agendaUrl' ? <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveInlineField('agendaUrl'); if (e.key === 'Escape') cancelEditing(); }} onBlur={() => saveInlineField('agendaUrl')} className="bg-slate-900 border border-indigo-500 text-white rounded px-2 py-0.5 text-sm flex-1 outline-none" /> : <span className="cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => startEditing('agendaUrl', activeClient.agendaurl || activeClient.agendaUrl || '')}>{activeClient.agendaurl || activeClient.agendaUrl || <span className="italic text-slate-500">—</span>}</span>}</div>
                        <div className="text-sm flex items-center gap-2 mt-2"><LinkIcon size={14} className="text-emerald-400"/> <span className="text-slate-400">{t.client_crm} :</span> {editingField === 'crm' ? <input autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveInlineField('crm'); if (e.key === 'Escape') cancelEditing(); }} onBlur={() => saveInlineField('crm')} className="bg-slate-900 border border-indigo-500 text-white rounded px-2 py-0.5 text-sm flex-1 outline-none" /> : <span className="cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => startEditing('crm', activeClient.crm || '')}>{activeClient.crm || <span className="italic text-slate-500">—</span>}</span>}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700 flex-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2 mb-2"><Database size={14}/> {t.client_knowledge}</p>
                      {editingField === 'knowledge_base' ? <textarea autoFocus value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') cancelEditing(); }} onBlur={() => saveInlineField('knowledge_base')} className="bg-slate-900 p-3 rounded-lg text-sm text-white h-24 w-full border border-indigo-500 outline-none resize-y" /> : <div className="bg-slate-900 p-3 rounded-lg text-sm text-slate-300 h-24 overflow-y-auto custom-scrollbar border border-slate-700 whitespace-pre-wrap cursor-pointer hover:border-indigo-500/50 transition-colors" onClick={() => startEditing('knowledge_base', activeClient.knowledge_base || '')}>{activeClient.knowledge_base || <span className="italic text-slate-500">{t.no_context}</span>}</div>}
                    </div>
                  </div>
                  
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-4">
                    <h3 className="text-slate-300 font-medium">{t.launch_agent} {activeClient.name}</h3>
                    <button onClick={handleGenerateLead} disabled={isGeneratingLead} className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 transition-colors disabled:opacity-50">{isGeneratingLead ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />} {isGeneratingLead ? t.btn_generating : t.btn_generate}</button>
                    <button onClick={openReportConfig} className="w-full max-w-xs bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium flex justify-center items-center gap-2 border border-slate-600 transition-colors"><FileBarChart size={18} className="text-emerald-400" /> {t.btn_report}</button>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mt-8">
                  <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Users size={18} className="text-indigo-400"/> {t.nav_dashboard}</h3>
                    <button onClick={() => { setProspectFormData({ id: null, name: '', company: '', email: '', phone: '', address: '', firstContact: new Date().toISOString().split('T')[0], followUp: '', status: 'pending' }); setShowAddProspectModal(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"><UserPlus size={14} /> {t.btn_manual_prospect}</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="text-xs uppercase bg-slate-900 text-slate-400">
                        <tr>
                          <th className="px-6 py-3">{t.table_prospect}</th>
                          <th className="px-6 py-3">Contact Info</th>
                          <th className="px-6 py-3">{t.table_status}</th>
                          <th className="px-6 py-3">{t.table_followup}</th>
                          <th className="px-6 py-3 text-center">{t.table_followup_count}</th>
                          <th className="px-6 py-3 text-right">{t.table_action}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!activeClient.prospects || activeClient.prospects.length === 0 ? (
                          <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">{t.no_prospects}</td></tr>
                        ) : (
                          activeClient.prospects.map((prospect: any) => {
                            const todayStr = new Date().toISOString().split('T')[0];
                            const followupStr = prospect.followup || prospect.followUp;
                            const isFollowUpDue = followupStr && followupStr <= todayStr;

                            return (
                            <tr key={prospect.id} className={`border-b border-slate-700 hover:bg-slate-700/30 group ${isFollowUpDue ? 'bg-indigo-900/10' : ''}`}>
                              <td className="px-6 py-4"><span className="font-medium text-white block">{prospect.name}</span><span className="text-xs text-slate-500">{prospect.firstcontact || prospect.firstContact}</span></td>
                              <td className="px-6 py-4 text-xs text-slate-400">
                                {prospect.email && <div className="truncate w-32" title={prospect.email}>📧 {prospect.email}</div>}
                                {prospect.phone && <div>📞 {prospect.phone}</div>}
                                {prospect.address && <div className="truncate w-32" title={prospect.address}>📍 {prospect.address}</div>}
                                {!prospect.email && !prospect.phone && !prospect.address && "-"}
                              </td>
                              <td className="px-6 py-4">
                                {prospect.status === 'accepted' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={14}/>{t.status_accepted}</span>}
                                {prospect.status === 'refused' && <span className="text-red-400 flex items-center gap-1"><XCircle size={14}/>{t.status_refused}</span>}
                                {prospect.status === 'pending' && <span className="text-slate-400 flex items-center gap-1"><Clock size={14}/>{t.status_pending}</span>}
                                {prospect.status === 'contacted' && <span className="text-blue-400 flex items-center gap-1"><Mail size={14}/>{t.status_contacted}</span>}
                                {prospect.status?.startsWith('followup_') && <span className="text-amber-400 flex items-center gap-1"><RefreshCw size={14}/>{t.status_followup} ({prospect.status.split('_')[1]})</span>}
                              </td>
                              <td className="px-6 py-4 font-medium"><span className={isFollowUpDue ? 'text-indigo-400' : 'text-slate-400'}>{followupStr || "-"}</span></td>
                              <td className="px-6 py-4 text-center"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-700 text-xs font-bold text-slate-200">{prospect.followup_count || 0}</span></td>

                              <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity mr-2">
                                    <button onClick={() => openEditProspect(prospect)} className="p-1.5 bg-slate-700 hover:bg-indigo-600 rounded text-white" title={t.btn_edit}><Pencil size={14} /></button>
                                    <button onClick={() => handleDeleteProspect(prospect.id)} className="p-1.5 bg-slate-700 hover:bg-red-600 rounded text-white" title={t.btn_delete}><Trash size={14} /></button>
                                </div>

                                {!prospect.email_subject && (
                                    <button onClick={() => handleGenerateMessageForProspect(prospect, false)} disabled={generatingMessageId === prospect.id} className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition flex items-center gap-1 text-xs" title={t.btn_gen_msg}>
                                        {generatingMessageId === prospect.id ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14} />} {t.btn_gen_msg}
                                    </button>
                                )}
                                
                                {prospect.email_subject && isFollowUpDue && (
                                    <button onClick={() => handleGenerateMessageForProspect(prospect, true)} disabled={generatingMessageId === prospect.id} className="p-1.5 border border-indigo-500 text-indigo-400 rounded hover:bg-indigo-500/20 transition flex items-center gap-1 text-xs ml-2" title={t.btn_gen_followup}>
                                        {generatingMessageId === prospect.id ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14} />} {t.btn_gen_followup}
                                    </button>
                                )}

                                {prospect.email_subject && (
                                  <>
                                    <button onClick={() => { setEmailEditLang(activeClient.report_lang || lang); setSelectedEmail({id: prospect.id, subject: prospect.email_subject, body: prospect.email_body}); }} className="p-2 bg-indigo-500/10 text-indigo-400 rounded hover:bg-indigo-500/20 transition flex items-center gap-2" title={t.email_title}><Pencil size={16} /></button>
                                    <button onClick={() => handleSendEmail(prospect)} disabled={sendingEmailId === prospect.id} className="p-2 bg-emerald-500/10 text-emerald-400 rounded hover:bg-emerald-500/20 transition flex items-center gap-2 disabled:opacity-50" title="Envoyer"><Send size={16} /></button>
                                  </>
                                )}
                              </td>
                            </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="max-w-3xl bg-slate-800 border border-slate-700 rounded-xl p-8 animate-in fade-in">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-700"><ShieldAlert className="text-indigo-400" size={28} /><h2 className="text-2xl font-bold">{t.legal_title}</h2></div>
            <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
              <section><h3 className="text-white font-semibold mb-2">{t.legal_1_title}</h3><p>{t.legal_1_text}</p></section>
              <section><h3 className="text-white font-semibold mb-2">{t.legal_2_title}</h3><p>{t.legal_2_text}</p></section>
              <section><h3 className="text-white font-semibold mb-2">{t.legal_3_title}</h3><p>{t.legal_3_text}</p></section>
              <section><h3 className="text-white font-semibold mb-2">{t.legal_4_title}</h3><p>{t.legal_4_text}</p></section>
              <section><h3 className="text-white font-semibold mb-2">{t.legal_5_title}</h3><p>{t.legal_5_text}</p></section>
              <div className="mt-12 pt-6 border-t border-slate-700 text-center text-slate-500 text-xs font-mono flex flex-col items-center gap-3"><img src="/logo.png" alt="Tejiona AI Solutions" className="w-16 h-16 object-contain opacity-60" />{t.legal_copyright}</div>
            </div>
          </div>
        )}
      </main>

      {(showAddClientModal || showEditClientModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSaveClient} className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center p-5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10"><h3 className="text-lg font-bold text-white">{showEditClientModal ? t.edit_client_title : t.add_client_title}</h3><button type="button" onClick={() => { setShowAddClientModal(false); setShowEditClientModal(false); }} className="text-slate-400 hover:text-white"><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_name}</label><input required type="text" value={clientFormData.name} onChange={e => setClientFormData({...clientFormData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_c_email}</label><input type="email" value={clientFormData.email} onChange={e => setClientFormData({...clientFormData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="ex: contact@client.com"/></div>
              </div>
              
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_plan}</label>
                <select value={clientFormData.plan} onChange={e => setClientFormData({...clientFormData, plan: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500">
                  <option value="none">{t.plan_none}</option>
                  <option value="starter">{t.plan_starter} — 500 {t.plan_leads_month} (399$/mois)</option>
                  <option value="growth">{t.plan_growth} — 1500 {t.plan_leads_month} (899$/mois)</option>
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_website}</label><input type="url" value={clientFormData.website} onChange={e => setClientFormData({...clientFormData, website: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="ex: www.client.com" /></div>
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_target}</label><div className="flex gap-2"><input type="text" value={clientFormData.target} onChange={e => setClientFormData({...clientFormData, target: e.target.value})} className="flex-1 bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /><button type="button" disabled={!clientFormData.website || isDetectingTarget} onClick={handleDetectTarget} className="px-3 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded-lg whitespace-nowrap flex items-center gap-1">{isDetectingTarget ? <><Loader2 size={12} className="animate-spin" />{t.form_detecting}</> : t.form_detect_target}</button></div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.agenda_label}</label><input type="text" value={clientFormData.agendaUrl} onChange={e => setClientFormData({...clientFormData, agendaUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.crm_label}</label><input type="text" value={clientFormData.crm} onChange={e => setClientFormData({...clientFormData, crm: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_knowledge}</label><textarea value={clientFormData.knowledge_base || ''} onChange={e => setClientFormData({...clientFormData, knowledge_base: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 min-h-[100px] resize-y" /></div>
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50 rounded-b-xl sticky bottom-0 z-10"><button type="button" onClick={() => { setShowAddClientModal(false); setShowEditClientModal(false); }} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">{t.btn_cancel}</button><button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md flex items-center gap-2">{isSaving ? <Loader2 size={16} className="animate-spin" /> : (showEditClientModal ? <Pencil size={16}/> : <PlusCircle size={16} />)} {showEditClientModal ? t.btn_edit : t.btn_add}</button></div>
          </form>
        </div>
      )}

      {(showAddProspectModal || showEditProspectModal) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleSaveProspect} className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center p-5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10"><h3 className="text-lg font-bold text-white flex items-center gap-2"><UserPlus size={18} className="text-emerald-400"/> {showEditProspectModal ? t.edit_prospect_title : t.add_prospect_title}</h3><button type="button" onClick={() => {setShowAddProspectModal(false); setShowEditProspectModal(false)}} className="text-slate-400 hover:text-white"><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_name}</label><input required type="text" value={prospectFormData.name} onChange={e => setProspectFormData({...prospectFormData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="Ex: Jean Dupont" /></div>
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_company}</label><input type="text" value={prospectFormData.company} onChange={e => setProspectFormData({...prospectFormData, company: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="Ex: Acme Corp" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_email}</label><input type="email" value={prospectFormData.email} onChange={e => setProspectFormData({...prospectFormData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_phone}</label><input type="tel" value={prospectFormData.phone} onChange={e => setProspectFormData({...prospectFormData, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_address}</label><input type="text" value={prospectFormData.address} onChange={e => setProspectFormData({...prospectFormData, address: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="Ex: 123 rue de la Paix" /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_contact}</label><input type="date" value={prospectFormData.firstContact} onChange={e => setProspectFormData({...prospectFormData, firstContact: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_followup}</label><input type="date" value={prospectFormData.followUp} onChange={e => setProspectFormData({...prospectFormData, followUp: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
              </div>
              {showEditProspectModal && (
                  <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Statut</label><select value={prospectFormData.status} onChange={e => setProspectFormData({...prospectFormData, status: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"><option value="pending">{t.status_pending}</option><option value="contacted">{t.status_contacted}</option><option value="followup_1">{t.status_followup} (1)</option><option value="followup_2">{t.status_followup} (2)</option><option value="followup_3">{t.status_followup} (3)</option><option value="followup_4">{t.status_followup} (4)</option><option value="followup_5">{t.status_followup} (5)</option><option value="accepted">{t.status_accepted}</option><option value="refused">{t.status_refused}</option></select></div>
              )}
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50 rounded-b-xl sticky bottom-0 z-10"><button type="button" onClick={() => {setShowAddProspectModal(false); setShowEditProspectModal(false)}} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">{t.btn_cancel}</button><button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md flex items-center gap-2">{isSaving ? <Loader2 size={16} className="animate-spin" /> : (showEditProspectModal ? <Pencil size={16}/> : <UserPlus size={16} />)} {showEditProspectModal ? t.btn_edit : t.btn_add}</button></div>
          </form>
        </div>
      )}

      {selectedEmail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="flex justify-between items-center p-5 border-b border-slate-700 bg-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><img src="/logo.png" alt="Tejiona" className="w-7 h-7 object-contain" /> {t.email_title}</h3>
              <button onClick={() => setSelectedEmail(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 bg-slate-900 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-700">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.email_lang}</label>
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => setEmailEditLang('fr')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${emailEditLang === 'fr' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>Français</button>
                    <button type="button" onClick={() => setEmailEditLang('en')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${emailEditLang === 'en' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}>English</button>
                  </div>
                </div>
                <button type="button" onClick={handleRegenerateEmail} disabled={isRegenerating} className="px-4 py-2 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors mt-4">
                  {isRegenerating ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} {isRegenerating ? t.email_regenerating : t.email_regenerate}
                </button>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.subject_label}</label>
                <input
                  type="text" value={selectedEmail.subject} onChange={(e) => setSelectedEmail({ ...selectedEmail, subject: e.target.value })}
                  className="w-full mt-2 bg-slate-800 border border-slate-700 text-white rounded-lg p-3 text-sm outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.message_label}</label>
                <textarea 
                  value={selectedEmail.body} onChange={(e) => setSelectedEmail({ ...selectedEmail, body: e.target.value })} 
                  className="w-full mt-2 bg-slate-800 border border-slate-700 text-white rounded-lg p-4 text-sm outline-none focus:border-indigo-500 min-h-[300px] resize-y custom-scrollbar flex-1 transition-colors leading-relaxed"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-end gap-3">
              <button onClick={() => setSelectedEmail(null)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">{t.btn_cancel}</button>
              <button onClick={handleUpdateEmail} disabled={isSaving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {t.btn_save_msg}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReportConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-slate-700">
              <h3 className="text-lg font-bold flex items-center gap-2"><Settings size={18} className="text-indigo-400" />{t.report_title}</h3>
              <button onClick={() => setShowReportConfigModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-slate-400 mb-4">{t.report_config_for} <strong className="text-white">{activeClient?.name}</strong></p>
              
              <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${reportMode === 'manual' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                <input type="radio" name="reportMode" value="manual" checked={reportMode === 'manual'} onChange={() => setReportMode('manual')} className="mt-1 text-indigo-500 bg-slate-800 focus:ring-indigo-500" />
                <p className="font-semibold text-white text-sm">{t.report_manual}</p>
              </label>

              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${reportMode === 'auto' ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}>
                  <input type="radio" name="reportMode" value="auto" checked={reportMode === 'auto'} onChange={() => setReportMode('auto')} className="mt-1 text-indigo-500 bg-slate-800 focus:ring-indigo-500" />
                  <p className="font-semibold text-white text-sm">{t.report_auto}</p>
                </label>

                {reportMode === 'auto' && (
                  <div className="pl-8 pr-4 py-2 animate-in slide-in-from-top-2 space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.report_freq}</label>
                      <select value={reportFreq} onChange={(e) => setReportFreq(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500">
                        <option value="daily">{t.freq_daily}</option>
                        <option value="weekly">{t.freq_weekly}</option>
                        <option value="monthly">{t.freq_monthly}</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                      {reportFreq === 'weekly' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <CalendarDays size={12} /> {t.report_day_week}
                          </label>
                          <select value={reportDayOfWeek} onChange={(e) => setReportDayOfWeek(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500">
                            <option value="1">{t.day_mon}</option>
                            <option value="2">{t.day_tue}</option>
                            <option value="3">{t.day_wed}</option>
                            <option value="4">{t.day_thu}</option>
                            <option value="5">{t.day_fri}</option>
                            <option value="6">{t.day_sat}</option>
                            <option value="7">{t.day_sun}</option>
                          </select>
                        </div>
                      )}
                      {reportFreq === 'monthly' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <CalendarDays size={12} /> {t.report_day_month}
                          </label>
                          <select value={reportDayOfMonth} onChange={(e) => setReportDayOfMonth(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500">
                            {[...Array(31)].map((_, i) => (<option key={i+1} value={i+1}>{i+1}</option>))}
                          </select>
                        </div>
                      )}
                      <div className={reportFreq === 'daily' ? 'col-span-2' : 'col-span-1'}>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Clock size={12} /> {t.report_time}
                        </label>
                        <input type="time" value={reportTime} onChange={(e) => setReportTime(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2 text-sm outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50 rounded-b-xl">
              <button onClick={() => setShowReportConfigModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">{t.btn_cancel}</button>
              <button onClick={handleSaveReportConfig} disabled={isSaving} className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md flex items-center gap-2">
                {isSaving ? <Loader2 size={16} className="animate-spin"/> : null}
                {reportMode === 'manual' ? t.btn_generate_now : t.btn_save}
              </button>
            </div>
          </div>
        </div>
      )}

      {showGeneratedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-indigo-900/20">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><img src="/logo.png" alt="Tejiona" className="w-8 h-8 object-contain" /> {t.generated_title}</h3>
                <p className="text-slate-400 text-sm mt-1">{t.client_label} {activeClient?.name}</p>
              </div>
              <button onClick={() => setShowGeneratedReport(false)} className="text-slate-400 hover:text-white bg-slate-900/50 p-2 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-1 flex flex-col">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg text-center"><p className="text-xs text-slate-400 uppercase font-bold mb-1">{t.kpi_total}</p><p className="text-3xl font-bold text-white">{reportStats.total}</p></div>
                <div className="bg-emerald-900/20 border border-emerald-700/50 p-4 rounded-lg text-center"><p className="text-xs text-emerald-400 uppercase font-bold mb-1">{t.kpi_accepted}</p><p className="text-3xl font-bold text-emerald-400">{reportStats.accepted}</p></div>
                <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg text-center"><p className="text-xs text-yellow-400 uppercase font-bold mb-1">{t.kpi_pending}</p><p className="text-3xl font-bold text-yellow-400">{reportStats.pending}</p></div>
                <div className="bg-red-900/20 border border-red-700/50 p-4 rounded-lg text-center"><p className="text-xs text-red-400 uppercase font-bold mb-1">{t.kpi_refused}</p><p className="text-3xl font-bold text-red-400">{reportStats.refused}</p></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-indigo-900/20 border border-indigo-700/50 p-3 rounded-lg text-center"><p className="text-xs text-indigo-400 uppercase font-bold mb-1">{t.kpi_contacted}</p><p className="text-2xl font-bold text-indigo-400">{reportStats.contacted}</p></div>
                <div className="bg-cyan-900/20 border border-cyan-700/50 p-3 rounded-lg text-center"><p className="text-xs text-cyan-400 uppercase font-bold mb-1">{t.kpi_total_followups}</p><p className="text-2xl font-bold text-cyan-400">{reportStats.totalFollowups}</p></div>
                <div className="bg-orange-900/20 border border-orange-700/50 p-3 rounded-lg text-center"><p className="text-xs text-orange-400 uppercase font-bold mb-1">{t.kpi_no_response}</p><p className="text-2xl font-bold text-orange-400">{reportStats.noResponse}</p></div>
              </div>
              
              <div className="flex-1 flex flex-col mt-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2"><FileEdit size={14}/> {t.report_edit_label}</label>
                <textarea 
                  value={reportEmailBody} 
                  onChange={(e) => setReportEmailBody(e.target.value)} 
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-4 text-sm outline-none focus:border-indigo-500 flex-1 resize-none custom-scrollbar leading-relaxed"
                />
              </div>
            </div>

            <div className="p-5 border-t border-slate-700 flex flex-col sm:flex-row justify-end gap-3 bg-slate-800/50">
              <button onClick={downloadCSV} className="px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-600"><Download size={16} /> {t.btn_download_csv}</button>
              <button onClick={handleSendReportToClient} disabled={isSendingReport} className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {isSendingReport ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {t.btn_send_email}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}