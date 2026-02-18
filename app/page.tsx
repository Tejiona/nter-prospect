/* FICHIER: app/page.tsx */
'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Mail, Play, Pause, 
  ShieldCheck, Globe, Database, CheckCircle, RefreshCw 
} from 'lucide-react';

// --- CONFIGURATION ---
const THEME = {
  bg: 'bg-slate-900',
  card: 'bg-slate-800',
  text: 'text-slate-50',
  accent: 'text-indigo-400',
  border: 'border-slate-700'
};

export default function AdminDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [stats, setStats] = useState({ generated: 0, emails: 0, openRate: 0 });

  // Simulation du "Cerveau IA"
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      // L'agent est actif : on simule des actions toutes les 3 secondes
      interval = setInterval(async () => {
        // 1. On appelle notre API (voir étape suivante)
        try {
          const response = await fetch('/api/agent/action');
          const data = await response.json();
          
          if (data.newLog) {
            setLogs(prev => [data.newLog, ...prev].slice(0, 6)); // Garder les 6 derniers logs
          }
          if (data.newLead) {
            setLeads(prev => [data.newLead, ...prev]);
            setStats(prev => ({ 
              ...prev, 
              generated: prev.generated + 1,
              emails: prev.emails + 1 
            }));
          }
        } catch (e) {
          console.error("Erreur agent", e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <div className={`min-h-screen ${THEME.bg} ${THEME.text} font-sans p-4 md:p-8`}>
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-10 pb-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg"><LayoutDashboard size={24} /></div>
          <h1 className="text-2xl font-bold">NTER <span className="text-indigo-400">Prospect</span></h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/30">
            <ShieldCheck size={14} /> Connexion Sécurisée
          </div>
          <button className="p-2 bg-slate-800 rounded hover:bg-slate-700"><Globe size={18} /></button>
        </div>
      </header>

      {/* STATS & CONTROL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Leads Générés" value={stats.generated} icon={<Users className="text-blue-400"/>} />
        <StatCard title="Emails Envoyés" value={stats.emails} icon={<Mail className="text-purple-400"/>} />
        <StatCard title="Taux d'ouverture" value="42%" icon={<CheckCircle className="text-emerald-400"/>} />
        
        {/* BOUTON D'ACTION */}
        <div className={`${THEME.card} p-6 rounded-xl border ${THEME.border} flex flex-col justify-between`}>
          <div className="flex justify-between">
            <span className="text-slate-400 text-sm">État du système</span>
            {isRunning && <span className="animate-pulse h-3 w-3 rounded-full bg-emerald-500"></span>}
          </div>
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className={`mt-4 w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${isRunning ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
          >
            {isRunning ? <><Pause size={18}/> STOP AGENT</> : <><Play size={18}/> START AGENT</>}
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TABLEAU DES LEADS (Gauche) */}
        <div className={`lg:col-span-2 ${THEME.card} rounded-xl border ${THEME.border} overflow-hidden`}>
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <h3 className="font-semibold text-lg">Derniers Leads Qualifiés</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-400">
              <thead className="text-xs uppercase bg-slate-900 text-slate-300">
                <tr>
                  <th className="px-6 py-3">Nom</th>
                  <th className="px-6 py-3">Société</th>
                  <th className="px-6 py-3">Score IA</th>
                  <th className="px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-8 italic">En attente de démarrage...</td></tr>
                )}
                {leads.map((lead, i) => (
                  <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/30 animate-in fade-in slide-in-from-left-4">
                    <td className="px-6 py-4 font-medium text-white">{lead.name}</td>
                    <td className="px-6 py-4">{lead.company}</td>
                    <td className="px-6 py-4"><span className="bg-indigo-900 text-indigo-300 px-2 py-1 rounded text-xs">{lead.score}/100</span></td>
                    <td className="px-6 py-4 text-emerald-400">Qualifié</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOGS IA (Droite) */}
        <div className={`lg:col-span-1 ${THEME.card} rounded-xl border ${THEME.border} flex flex-col h-[400px]`}>
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2"><Database size={16}/> Activité Neuronale</h3>
            {isRunning && <RefreshCw size={14} className="animate-spin text-slate-500"/>}
          </div>
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-3 bg-slate-950/50">
             {logs.map((log, i) => (
               <div key={i} className="text-slate-300 border-l-2 border-indigo-500 pl-2">
                 <span className="text-slate-500 block text-[10px]">{new Date().toLocaleTimeString()}</span>
                 {log}
               </div>
             ))}
             {logs.length === 0 && <span className="text-slate-600">Système en veille...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
      <div className="flex justify-between mb-4">
        <div className="p-2 bg-slate-700 rounded-lg">{icon}</div>
      </div>
      <h3 className="text-slate-400 text-sm">{title}</h3>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  )
}