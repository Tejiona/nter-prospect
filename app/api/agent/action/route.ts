/* FICHIER: app/api/agent/action/route.ts */
import { NextResponse } from 'next/server';

// Banques de données fictives pour la démo
const NAMES = ["Jean Dupont", "Alice Martin", "Lucas Bernard", "Chloé Petit", "Thomas Richard"];
const COMPANIES = ["TechFlow", "SaaS Corp", "Data AI", "Innovate Inc", "Web Solutions"];
const LOGS = [
  "Scraping LinkedIn Profile ID: #4492...",
  "Analyse sémantique du profil (GPT-4)...",
  "Détection: Lead à haute valeur (Score: 88)",
  "Génération de l'email d'approche personnalisée...",
  "Vérification DNS de l'email en cours...",
  "Email envoyé via SMTP Sécurisé."
];

export async function GET() {
  // Simule une latence réseau (comme si l'IA réfléchissait)
  
  const randomLog = LOGS[Math.floor(Math.random() * LOGS.length)];
  const shouldCreateLead = Math.random() > 0.7; // 30% de chance de trouver un lead

  let newLead = null;
  if (shouldCreateLead) {
    newLead = {
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      company: COMPANIES[Math.floor(Math.random() * COMPANIES.length)],
      score: Math.floor(Math.random() * (99 - 70) + 70)
    };
  }

  return NextResponse.json({
    newLog: randomLog,
    newLead: newLead
  });
}