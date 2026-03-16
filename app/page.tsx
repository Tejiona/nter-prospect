/* FICHIER: app/page.tsx */
'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase'; 
import { 
  LayoutDashboard, Users, Briefcase, FileText, Globe, 
  Play, Calendar, Link as LinkIcon, ShieldAlert, CheckCircle, XCircle, Clock,
  FileBarChart, X, Settings, PlusCircle, Loader2, Download, Send, CalendarDays,
  Database, Eye, Mail, UserPlus
} from 'lucide-react';

// --- 1. DICTIONNAIRE BILINGUE COMPLET ---
const TRANSLATIONS = {
  fr: {
    nav_dashboard: "Tableau de bord", nav_clients: "Mes Clients", nav_legal: "Légal & CGU",
    btn_generate: "Générer Lead IA", btn_generating: "Génération...", client_info: "Informations Client", client_target: "Cible IA",
    launch_agent: "Lancer l'Agent IA pour", client_agenda: "Disponibilité (Agenda)", client_crm: "Liaisons Logicielles",
    client_knowledge: "Base de connaissances de l'IA", 
    table_prospect: "Prospect", table_contact1: "1er Contact", table_status: "Retour Prospect", table_followup: "Prochaine Relance", table_action: "Message", 
    status_pending: "En attente", status_accepted: "Accepté", status_refused: "Refusé",
    // Remplace les entrées "legal_..." existantes par celles-ci dans "fr":
    legal_title: "Mentions Légales & CGU", 
    legal_1_title: "1. Acceptation des conditions",
    legal_1_text: "En accédant ou en utilisant notre plateforme, vous acceptez ces conditions. NTER Prospect agit en tant qu'outil B2B et B2C pour automatiser la prospection.",
    legal_2_title: "2. Traitement des données et Sécurité",
    legal_2_text: "Nous traitons vos données conformément au RGPD et à la LPRPDE. Les données (formulaires, API) sont utilisées strictement pour fournir le service. Vos informations sont stockées de manière cryptée. Nous ne vendons pas vos données.",
    legal_3_title: "3. Collecte de données tierces (Scraping)",
    legal_3_text: "NTER Prospect collecte des informations publiques via des fournisseurs. Vous vous engagez à utiliser ces informations dans le strict cadre légal B2B.",
    legal_4_title: "4. IA et Responsabilités",
    legal_4_text: "Les e-mails sont générés par IA. Vous êtes seul responsable du contenu généré, de sa vérification et de son envoi final.",
    legal_5_title: "5. Vos droits",
    legal_5_text: "Vous avez le droit d'accéder, de modifier ou de demander la suppression totale de vos données personnelles stockées sur notre plateforme.",
    legal_copyright: "© Copyright NTER Prospect 2026. Tous droits réservés.",
    btn_report: "Rapport de Prospection", report_title: "Configuration", report_config_for: "Configuration pour :",
    report_manual: "Génération et envoi manuels", report_auto: "Génération et envoi automatisés",
    report_freq: "Périodicité", freq_daily: "Quotidien", freq_weekly: "Hebdomadaire", freq_monthly: "Mensuel",
    report_time: "Heure d'envoi", report_day_week: "Jour de la semaine", report_day_month: "Jour du mois",
    day_mon: "Lundi", day_tue: "Mardi", day_wed: "Mercredi", day_thu: "Jeudi", day_fri: "Vendredi", day_sat: "Samedi", day_sun: "Dimanche",
    btn_save: "Enregistrer la configuration", btn_generate_now: "Générer le rapport maintenant", btn_cancel: "Annuler",
    btn_new_client: "+ Nouveau Client", add_client_title: "Ajouter un client", form_name: "Nom de l'entreprise",
    form_target: "Cible de prospection (IA)", form_agenda: "Lien de l'agenda", form_crm: "CRM utilisé", 
    form_knowledge: "Contexte, descriptif, site web, offres (L'IA lira ceci)", 
    btn_add: "Ajouter",
    generated_title: "Rapport de Campagne",
    kpi_total: "Total Prospects", kpi_accepted: "Rendez-vous", kpi_pending: "En attente", kpi_refused: "Refusés",
    btn_download_csv: "Télécharger (CSV)", btn_send_email: "Envoyer au client",
    email_title: "Message généré par l'IA",
    loading: "Chargement...", switch_lang: "Switch to English", company_label: "Entreprise :",
    agenda_label: "Agenda", crm_label: "CRM", no_context: "Aucun contexte renseigné. L'IA se basera uniquement sur la cible.",
    no_prospects: "Aucun prospect généré.", client_label: "Client :", ai_analysis: "💡 Analyse IA",
    analysis_text_1: "La campagne pour", analysis_text_2: "présente un taux de conversion de",
    analysis_text_3: "Nous recommandons de relancer les", analysis_text_4: "prospects en attente d'ici 48 heures.",
    subject_label: "Sujet :", message_label: "Message :", btn_close: "Fermer", alert_config_saved: "Configuration enregistrée !",
    alert_ai_error: "Impossible de contacter l'IA.",
    btn_manual_prospect: "+ Prospect Manuel", add_prospect_title: "Ajouter un Prospect Manuellement",
    form_p_name: "Nom Complet", form_p_company: "Entreprise du prospect", form_p_email: "Adresse Email", form_p_phone: "Téléphone",
    form_p_contact: "Date du contact", form_p_followup: "Date de relance prévue"
  },
  en: {
    nav_dashboard: "Dashboard", nav_clients: "My Clients", nav_legal: "Legal & TOS",
    btn_generate: "Generate AI Lead", btn_generating: "Generating...", client_info: "Client Information", client_target: "AI Target",
    launch_agent: "Launch AI Agent for", client_agenda: "Availability (Calendar)", client_crm: "Software Integrations",
    client_knowledge: "AI Knowledge Base", 
    table_prospect: "Prospect", table_contact1: "1st Contact", table_status: "Prospect Feedback", table_followup: "Next Follow-up", table_action: "Message", 
    status_pending: "Pending", status_accepted: "Accepted", status_refused: "Refused",
    // Remplace les entrées "legal_..." existantes par celles-ci dans "en":
    legal_title: "Legal Notices & TOS", 
    legal_1_title: "1. Acceptance of Terms",
    legal_1_text: "By accessing or using our platform, you agree to these terms. NTER Prospect acts as a B2B and B2C tool to automate prospecting.",
    legal_2_title: "2. Data Processing and Security",
    legal_2_text: "We process data in accordance with GDPR and PIPEDA. Data is used strictly to provide the service and is stored securely. We do not sell your data.",
    legal_3_title: "3. Third-Party Data Collection (Scraping)",
    legal_3_text: "NTER Prospect collects public info from service providers. You agree to use this strictly within B2B legal frameworks.",
    legal_4_title: "4. AI and Liability",
    legal_4_text: "Emails are AI-generated. You are solely responsible for the generated content, its verification, and final transmission.",
    legal_5_title: "5. Your Rights",
    legal_5_text: "You have the right to access, correct, or request the deletion of all your personal data stored on our platform.",
    legal_copyright: "© Copyright NTER Prospect 2026. All rights reserved.",
    btn_report: "Prospecting Report", report_title: "Configuration", report_config_for: "Configuration for:",
    report_manual: "Manual generation and sending", report_auto: "Automated generation and sending",
    report_freq: "Frequency", freq_daily: "Daily", freq_weekly: "Weekly", freq_monthly: "Monthly",
    report_time: "Sending time", report_day_week: "Day of the week", report_day_month: "Day of the month",
    day_mon: "Monday", day_tue: "Tuesday", day_wed: "Wednesday", day_thu: "Thursday", day_fri: "Friday", day_sat: "Saturday", day_sun: "Sunday",
    btn_save: "Save configuration", btn_generate_now: "Generate report now", btn_cancel: "Cancel",
    btn_new_client: "+ New Client", add_client_title: "Add a Client", form_name: "Company Name",
    form_target: "Prospecting Target (AI)", form_agenda: "Calendar Link", form_crm: "CRM Used", 
    form_knowledge: "Context, description, website, offers (AI reads this)", 
    btn_add: "Add",
    generated_title: "Campaign Report",
    kpi_total: "Total Prospects", kpi_accepted: "Meetings", kpi_pending: "Pending", kpi_refused: "Refused",
    btn_download_csv: "Download (CSV)", btn_send_email: "Send to client",
    email_title: "AI Generated Message",
    loading: "Loading...", switch_lang: "Passer en Français", company_label: "Company:",
    agenda_label: "Calendar", crm_label: "CRM", no_context: "No context provided. The AI will rely solely on the target.",
    no_prospects: "No prospects generated.", client_label: "Client:", ai_analysis: "💡 AI Analysis",
    analysis_text_1: "The campaign for", analysis_text_2: "has a conversion rate of",
    analysis_text_3: "We recommend following up with the", analysis_text_4: "pending prospects within 48 hours.",
    subject_label: "Subject:", message_label: "Message:", btn_close: "Close", alert_config_saved: "Configuration saved!",
    alert_ai_error: "Unable to contact AI.",
    btn_manual_prospect: "+ Manual Prospect", add_prospect_title: "Add a Prospect Manually",
    form_p_name: "Full Name", form_p_company: "Prospect's Company", form_p_email: "Email Address", form_p_phone: "Phone Number",
    form_p_contact: "Contact Date", form_p_followup: "Expected Follow-up Date"
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
  const [newClientData, setNewClientData] = useState({ name: '', target: '', agendaUrl: '', crm: '', knowledge_base: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingLead, setIsGeneratingLead] = useState(false);

  const [showAddProspectModal, setShowAddProspectModal] = useState(false);
  const [newProspectData, setNewProspectData] = useState({ name: '', company: '', email: '', phone: '', firstContact: new Date().toISOString().split('T')[0], followUp: '' });

  const [selectedEmail, setSelectedEmail] = useState<{subject: string, body: string} | null>(null);

  // ÉTATS RAPPORT (Avec les jours et heures)
  const [showReportConfigModal, setShowReportConfigModal] = useState(false);
  const [reportMode, setReportMode] = useState<'manual' | 'auto'>('manual');
  const [reportFreq, setReportFreq] = useState('weekly');
  const [reportTime, setReportTime] = useState('08:00');
  const [reportDayOfWeek, setReportDayOfWeek] = useState('1'); 
  const [reportDayOfMonth, setReportDayOfMonth] = useState('1'); 
  const [showGeneratedReport, setShowGeneratedReport] = useState(false);
  const [reportStats, setReportStats] = useState({ total: 0, accepted: 0, pending: 0, refused: 0 });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('clients').select('*, prospects(*)').order('created_at', { referencedTable: 'prospects', ascending: false });
    if (!error && data) {
      setClients(data);
      if (data.length > 0 && !activeClient) setActiveClient(data[0]);
    }
    setIsLoading(false);
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const { data, error } = await supabase.from('clients').insert([
      { name: newClientData.name, target: newClientData.target, agendaurl: newClientData.agendaUrl, crm: newClientData.crm, knowledge_base: newClientData.knowledge_base }
    ]).select('*, prospects(*)');
    
    if (!error && data) {
      setClients([...clients, data[0]]);
      setActiveClient(data[0]);
      setShowAddClientModal(false);
      setNewClientData({ name: '', target: '', agendaUrl: '', crm: '', knowledge_base: '' });
    }
    setIsSaving(false);
  };

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;
    setIsSaving(true);
    
    const formattedName = `${newProspectData.name} (${newProspectData.company})`;
    
    const { data, error } = await supabase.from('prospects').insert([
      { 
        client_id: activeClient.id,
        name: formattedName,
        email: newProspectData.email,
        phone: newProspectData.phone,
        firstContact: newProspectData.firstContact,
        status: 'pending',
        followUp: newProspectData.followUp
      }
    ]).select('*');

    if (!error && data && data.length > 0) {
      const updatedClient = { ...activeClient, prospects: [data[0], ...(activeClient.prospects || [])] };
      setActiveClient(updatedClient);
      setClients(clients.map(c => c.id === activeClient.id ? updatedClient : c));
      setShowAddProspectModal(false);
      setNewProspectData({ name: '', company: '', email: '', phone: '', firstContact: new Date().toISOString().split('T')[0], followUp: '' });
    } else {
      console.error(error);
      alert("Erreur d'enregistrement du prospect.");
    }
    setIsSaving(false);
  };

  const handleGenerateLead = async () => {
    if (!activeClient) return;
    setIsGeneratingLead(true);
    try {
      const response = await fetch('/api/agent/action', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: activeClient.target, clientName: activeClient.name, knowledgeBase: activeClient.knowledge_base })
      });
      const aiData = await response.json();

      if (aiData.newLead) {
        const leadName = `${aiData.newLead.name} (${aiData.newLead.company})`;
        const today = new Date().toISOString().split('T')[0];
        const followUpDate = new Date(); followUpDate.setDate(followUpDate.getDate() + 3);
        const followUpStr = followUpDate.toISOString().split('T')[0];

        const { data: dbData, error } = await supabase.from('prospects').insert([
          { client_id: activeClient.id, name: leadName, firstContact: today, status: 'pending', followUp: followUpStr, email_subject: aiData.newLead.email_subject, email_body: aiData.newLead.email_body }
        ]).select('*'); 

        if (!error && dbData && dbData.length > 0) {
          const updatedClient = { ...activeClient, prospects: [dbData[0], ...(activeClient.prospects || [])] };
          setActiveClient(updatedClient);
          setClients(clients.map(c => c.id === activeClient.id ? updatedClient : c));
        }
      }
    } catch (e) {
      alert(t.alert_ai_error);
    } finally {
      setIsGeneratingLead(false);
    }
  };

  const handleProcessReportAction = () => {
    if (reportMode === 'auto') {
      setShowReportConfigModal(false); 
      alert(t.alert_config_saved);
    } else {
      const prospects = activeClient.prospects || [];
      setReportStats({
        total: prospects.length, accepted: prospects.filter((p: any) => p.status === 'accepted').length,
        pending: prospects.filter((p: any) => p.status === 'pending').length, refused: prospects.filter((p: any) => p.status === 'refused').length,
      });
      setShowReportConfigModal(false); setShowGeneratedReport(true);    
    }
  };

  const downloadCSV = () => {
    const prospects = activeClient.prospects || [];
    const headers = ["Nom du Prospect", "Email", "Téléphone", "1er Contact", "Statut", "Prochaine Relance"];
    const rows = prospects.map((p: any) => `"${p.name}","${p.email || ''}","${p.phone || ''}","${p.firstContact || ''}","${p.status}","${p.followUp || ''}"`);
    const csvContent = headers.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Rapport_${activeClient.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 font-sans flex flex-col md:flex-row relative">
      {/* BARRE LATÉRALE */}
      <aside className="w-full md:w-64 border-r border-slate-700 bg-slate-800/50 p-4 flex flex-col z-10">
        <div className="flex items-center gap-3 mb-8 px-2 mt-4">
          <div className="bg-indigo-600 p-2 rounded-lg"><LayoutDashboard size={20} /></div>
          <h1 className="text-xl font-bold tracking-tight">NTER <span className="text-indigo-400">Prospect</span></h1>
        </div>
        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('clients')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'clients' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Briefcase size={18} /> {t.nav_clients}
          </button>
          <button onClick={() => setActiveTab('legal')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'legal' ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800'}`}>
            <FileText size={18} /> {t.nav_legal}
          </button>
        </nav>
        <div className="mt-auto border-t border-slate-700 pt-4">
          <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 p-2 rounded border border-slate-600 transition">
            <Globe size={16} /> {t.switch_lang}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto z-10">
        {activeTab === 'clients' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex gap-4 overflow-x-auto pb-4 border-b border-slate-700 items-center">
              {isLoading ? (
                <span className="text-slate-400 text-sm flex items-center gap-2"><Loader2 size={16} className="animate-spin"/> {t.loading}</span>
              ) : (
                clients.map(client => (
                  <button key={client.id} onClick={() => setActiveClient(client)} className={`px-4 py-2 rounded-full text-sm font-semibold border whitespace-nowrap ${activeClient?.id === client.id ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'}`}>
                    {client.name}
                  </button>
                ))
              )}
              <button onClick={() => setShowAddClientModal(true)} className="px-4 py-2 rounded-full text-sm font-semibold border border-dashed border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 whitespace-nowrap">
                <PlusCircle size={16} /> {t.btn_new_client}
              </button>
            </div>

            {activeClient && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Briefcase size={18} className="text-indigo-400"/> {t.client_info}</h2>
                    <div className="space-y-3">
                      <p className="text-sm"><span className="text-slate-400">{t.company_label}</span> {activeClient.name}</p>
                      <p className="text-sm"><span className="text-slate-400">{t.client_target} :</span> {activeClient.target}</p>
                      <div className="pt-3 border-t border-slate-700">
                        <p className="text-sm flex items-center gap-2"><Calendar size={14} className="text-blue-400"/> <span className="text-slate-400">{t.client_agenda} :</span> {activeClient.agendaurl || activeClient.agendaUrl}</p>
                        <p className="text-sm flex items-center gap-2 mt-2"><LinkIcon size={14} className="text-emerald-400"/> <span className="text-slate-400">{t.client_crm} :</span> {activeClient.crm}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700 flex-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-2 mb-2"><Database size={14}/> {t.client_knowledge}</p>
                      <div className="bg-slate-900 p-3 rounded-lg text-sm text-slate-300 h-24 overflow-y-auto custom-scrollbar border border-slate-700 whitespace-pre-wrap">
                        {activeClient.knowledge_base || <span className="italic text-slate-500">{t.no_context}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-4">
                    <h3 className="text-slate-300 font-medium">{t.launch_agent} {activeClient.name}</h3>
                    <button onClick={handleGenerateLead} disabled={isGeneratingLead} className="w-full max-w-xs bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20 transition-colors disabled:opacity-50">
                      {isGeneratingLead ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />} 
                      {isGeneratingLead ? t.btn_generating : t.btn_generate}
                    </button>
                    <button onClick={() => setShowReportConfigModal(true)} className="w-full max-w-xs bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium flex justify-center items-center gap-2 border border-slate-600 transition-colors">
                      <FileBarChart size={18} className="text-emerald-400" /> {t.btn_report}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden mt-8">
                  <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                    <h3 className="font-semibold text-lg flex items-center gap-2"><Users size={18} className="text-indigo-400"/> {t.nav_dashboard}</h3>
                    <button onClick={() => setShowAddProspectModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                      <UserPlus size={14} /> {t.btn_manual_prospect}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="text-xs uppercase bg-slate-900 text-slate-400">
                        <tr>
                          <th className="px-6 py-3">{t.table_prospect}</th>
                          <th className="px-6 py-3">Contact Info</th>
                          <th className="px-6 py-3">{t.table_status}</th>
                          <th className="px-6 py-3">{t.table_followup}</th>
                          <th className="px-6 py-3 text-right">{t.table_action}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!activeClient.prospects || activeClient.prospects.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">{t.no_prospects}</td></tr>
                        ) : (
                          activeClient.prospects.map((prospect: any) => (
                            <tr key={prospect.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                              <td className="px-6 py-4">
                                <span className="font-medium text-white block">{prospect.name}</span>
                                <span className="text-xs text-slate-500">{prospect.firstContact}</span>
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400">
                                {prospect.email && <div className="truncate w-32" title={prospect.email}>📧 {prospect.email}</div>}
                                {prospect.phone && <div>📞 {prospect.phone}</div>}
                                {!prospect.email && !prospect.phone && "-"}
                              </td>
                              <td className="px-6 py-4">
                                {prospect.status === 'accepted' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={14}/>{t.status_accepted}</span>}
                                {prospect.status === 'refused' && <span className="text-red-400 flex items-center gap-1"><XCircle size={14}/>{t.status_refused}</span>}
                                {prospect.status === 'pending' && <span className="text-yellow-400 flex items-center gap-1"><Clock size={14}/>{t.status_pending}</span>}
                              </td>
                              <td className="px-6 py-4 text-slate-400">{prospect.followUp}</td>
                              <td className="px-6 py-4 text-right">
                                {prospect.email_subject && (
                                  <button onClick={() => setSelectedEmail({subject: prospect.email_subject, body: prospect.email_body})} className="p-2 bg-indigo-500/10 text-indigo-400 rounded hover:bg-indigo-500/20 transition flex items-center gap-2 ml-auto" title={t.email_title}>
                                    <Eye size={16} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
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
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-700">
              <ShieldAlert className="text-indigo-400" size={28} />
              <h2 className="text-2xl font-bold">{t.legal_title}</h2>
            </div>
            <div className="space-y-6 text-slate-300 leading-relaxed text-sm">
              <section><h3 className="text-white font-semibold mb-2">{t.legal_1_title}</h3><p>{t.legal_1_text}</p></section>
              <section><h3 className="text-white font-semibold mb-2">{t.legal_2_title}</h3><p>{t.legal_2_text}</p></section>
              <section><h3 className="text-white font-semibold mb-2">{t.legal_3_title}</h3><p>{t.legal_3_text}</p></section>
              <section><h3 className="text-white font-semibold mb-2">{t.legal_4_title}</h3><p>{t.legal_4_text}</p></section>
              <section><h3 className="text-white font-semibold mb-2">{t.legal_5_title}</h3><p>{t.legal_5_text}</p></section>
              
              <div className="mt-12 pt-6 border-t border-slate-700 text-center text-slate-500 text-xs font-mono">
                {t.legal_copyright}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALES */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-slate-700 bg-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Mail size={18} className="text-indigo-400"/> {t.email_title}</h3>
              <button onClick={() => setSelectedEmail(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 bg-slate-900">
              <div className="mb-4"><span className="text-xs font-bold text-slate-500 uppercase">{t.subject_label}</span><p className="text-white font-medium mt-1">{selectedEmail.subject}</p></div>
              <div><span className="text-xs font-bold text-slate-500 uppercase">{t.message_label}</span><div className="mt-2 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed bg-slate-800 p-4 rounded-lg border border-slate-700">{selectedEmail.body}</div></div>
            </div>
            <div className="p-4 border-t border-slate-700 bg-slate-800 text-right">
              <button onClick={() => setSelectedEmail(null)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold">{t.btn_close}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE : NOUVEAU CLIENT */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleAddClient} className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center p-5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <h3 className="text-lg font-bold text-white">{t.add_client_title}</h3>
              <button type="button" onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_name}</label><input required type="text" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_target}</label><input required type="text" value={newClientData.target} onChange={e => setNewClientData({...newClientData, target: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.agenda_label}</label><input type="text" value={newClientData.agendaUrl} onChange={e => setNewClientData({...newClientData, agendaUrl: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.crm_label}</label><input type="text" value={newClientData.crm} onChange={e => setNewClientData({...newClientData, crm: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_knowledge}</label><textarea value={newClientData.knowledge_base} onChange={e => setNewClientData({...newClientData, knowledge_base: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 min-h-[100px] resize-y" /></div>
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50 rounded-b-xl sticky bottom-0 z-10">
              <button type="button" onClick={() => setShowAddClientModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">{t.btn_cancel}</button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md flex items-center gap-2">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />} {t.btn_add}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE : AJOUTER UN PROSPECT MANUEL */}
      {showAddProspectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <form onSubmit={handleAddProspect} className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center p-5 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><UserPlus size={18} className="text-emerald-400"/> {t.add_prospect_title}</h3>
              <button type="button" onClick={() => setShowAddProspectModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_name}</label><input required type="text" value={newProspectData.name} onChange={e => setNewProspectData({...newProspectData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="Ex: Jean Dupont" /></div>
              <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_company}</label><input required type="text" value={newProspectData.company} onChange={e => setNewProspectData({...newProspectData, company: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" placeholder="Ex: Acme Corp" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_email}</label><input type="email" value={newProspectData.email} onChange={e => setNewProspectData({...newProspectData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_phone}</label><input type="tel" value={newProspectData.phone} onChange={e => setNewProspectData({...newProspectData, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_contact}</label><input type="date" value={newProspectData.firstContact} onChange={e => setNewProspectData({...newProspectData, firstContact: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
                <div><label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.form_p_followup}</label><input type="date" value={newProspectData.followUp} onChange={e => setNewProspectData({...newProspectData, followUp: e.target.value})} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" /></div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50 rounded-b-xl sticky bottom-0 z-10">
              <button type="button" onClick={() => setShowAddProspectModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">{t.btn_cancel}</button>
              <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md flex items-center gap-2">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} {t.btn_add}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODALE : CONFIGURATION DU RAPPORT (AVEC LE CALENDRIER RESTAURÉ !) */}
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
                    
                    {/* LE VOICI : LE BLOC CONDITIONNEL POUR LES JOURS ET HEURES */}
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4">
                      {reportFreq === 'weekly' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><CalendarDays size={12} /> {t.report_day_week}</label>
                          <select value={reportDayOfWeek} onChange={(e) => setReportDayOfWeek(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500">
                            <option value="1">{t.day_mon}</option><option value="2">{t.day_tue}</option><option value="3">{t.day_wed}</option><option value="4">{t.day_thu}</option><option value="5">{t.day_fri}</option><option value="6">{t.day_sat}</option><option value="7">{t.day_sun}</option>
                          </select>
                        </div>
                      )}
                      {reportFreq === 'monthly' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><CalendarDays size={12} /> {t.report_day_month}</label>
                          <select value={reportDayOfMonth} onChange={(e) => setReportDayOfMonth(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500">
                            {[...Array(31)].map((_, i) => (<option key={i+1} value={i+1}>{i+1}</option>))}
                          </select>
                        </div>
                      )}
                      <div className={reportFreq === 'daily' ? 'col-span-2' : 'col-span-1'}>
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Clock size={12} /> {t.report_time}</label>
                        <input type="time" value={reportTime} onChange={(e) => setReportTime(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2 text-sm outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-slate-700 flex justify-end gap-3 bg-slate-800/50 rounded-b-xl">
              <button onClick={() => setShowReportConfigModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white">{t.btn_cancel}</button>
              <button onClick={handleProcessReportAction} className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md">
                {reportMode === 'manual' ? t.btn_generate_now : t.btn_save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE : LE RAPPORT GÉNÉRÉ */}
      {showGeneratedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-gradient-to-r from-slate-800 to-indigo-900/20">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><FileBarChart className="text-indigo-400" /> {t.generated_title}</h3>
                <p className="text-slate-400 text-sm mt-1">{t.client_label} {activeClient?.name} | {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}</p>
              </div>
              <button onClick={() => setShowGeneratedReport(false)} className="text-slate-400 hover:text-white bg-slate-900/50 p-2 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg text-center"><p className="text-xs text-slate-400 uppercase font-bold mb-1">{t.kpi_total}</p><p className="text-3xl font-bold text-white">{reportStats.total}</p></div>
                <div className="bg-emerald-900/20 border border-emerald-700/50 p-4 rounded-lg text-center"><p className="text-xs text-emerald-400 uppercase font-bold mb-1">{t.kpi_accepted}</p><p className="text-3xl font-bold text-emerald-400">{reportStats.accepted}</p></div>
                <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg text-center"><p className="text-xs text-yellow-400 uppercase font-bold mb-1">{t.kpi_pending}</p><p className="text-3xl font-bold text-yellow-400">{reportStats.pending}</p></div>
                <div className="bg-red-900/20 border border-red-700/50 p-4 rounded-lg text-center"><p className="text-xs text-red-400 uppercase font-bold mb-1">{t.kpi_refused}</p><p className="text-3xl font-bold text-red-400">{reportStats.refused}</p></div>
              </div>
              <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-lg">
                <h4 className="font-semibold text-indigo-300 mb-2">{t.ai_analysis}</h4>
                <p className="text-sm text-slate-300">
                  {t.analysis_text_1} <strong>{activeClient?.name}</strong> {t.analysis_text_2} <strong className="text-white ml-1">{reportStats.total > 0 ? Math.round((reportStats.accepted / reportStats.total) * 100) : 0}%</strong>. 
                  {t.analysis_text_3} {reportStats.pending} {t.analysis_text_4}
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-slate-700 flex flex-col sm:flex-row justify-end gap-3 bg-slate-800/50">
              <button onClick={downloadCSV} className="px-4 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-600">
                <Download size={16} /> {t.btn_download_csv}
              </button>
              <button className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-md flex items-center justify-center gap-2 transition-colors">
                <Send size={16} /> {t.btn_send_email}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}