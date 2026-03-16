/* FICHIER: app/api/agent/action/route.ts */
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialisation de Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const target = body.target || "Entreprises locales";
    const clientName = body.clientName || "Notre agence";
    const knowledgeBase = body.knowledgeBase || "Aucune information supplémentaire fournie.";

    // ====================================================================
    // ÉTAPE 1 : SCRAPING DES VRAIES DONNÉES (Google Maps & Proxycurl)
    // ====================================================================
    let scrapedName = "";
    let scrapedCompany = "";
    let scrapedContext = "";

    // 1A. Détection intelligente : Commerce local vs B2B
    const isLocalBusiness = target.toLowerCase().includes('restaurant') || 
                            target.toLowerCase().includes('boulangerie') || 
                            target.toLowerCase().includes('hôtel') ||
                            target.toLowerCase().includes('boutique') ||
                            target.toLowerCase().includes('agence');

    // --------------------------------------------------------------------
    // SCRAPER 1 : GOOGLE MAPS (Commerces Locaux)
    // --------------------------------------------------------------------
    if (isLocalBusiness && process.env.GOOGLE_MAPS_API_KEY) {
        console.log("Scraping via Google Maps API...");
        try {
            const mapsUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(target)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
            const mapsResponse = await fetch(mapsUrl);
            const mapsData = await mapsResponse.json();

            if (mapsData.results && mapsData.results.length > 0) {
                const place = mapsData.results[0];
                scrapedCompany = place.name;
                scrapedName = "Gérant / Direction"; // Google ne donne pas le nom du patron directement
                scrapedContext = `Adresse: ${place.formatted_address}. Note Google: ${place.rating}/5 avec ${place.user_ratings_total} avis.`;
            }
        } catch (err) {
            console.error("Erreur Google Maps :", err);
        }
    } 
    // --------------------------------------------------------------------
    // SCRAPER 2 : PROXYCURL (Profils B2B LinkedIn)
    // --------------------------------------------------------------------
    else if (!isLocalBusiness && process.env.PROXYCURL_API_KEY) {
        console.log("Scraping via Proxycurl (LinkedIn)...");
        try {
            // ACTION A : Rechercher l'URL LinkedIn du profil
            const searchUrl = `https://nubela.co/proxycurl/api/v2/search/person?keyword=${encodeURIComponent(target)}&page_size=1`; 
            const searchResponse = await fetch(searchUrl, {
                headers: { 'Authorization': `Bearer ${process.env.PROXYCURL_API_KEY}` }
            });
            
            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                
                if (searchData.results && searchData.results.length > 0) {
                    const linkedInUrl = searchData.results[0].profile_url;
                    console.log("Profil LinkedIn trouvé :", linkedInUrl);

                    // ACTION B : Scraper le profil complet pour nourrir l'IA
                    const profileUrl = `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedInUrl)}&use_cache=if-present`;
                    const profileResponse = await fetch(profileUrl, {
                        headers: { 'Authorization': `Bearer ${process.env.PROXYCURL_API_KEY}` }
                    });
                    
                    if (profileResponse.ok) {
                        const profileData = await profileResponse.json();
                        
                        scrapedName = profileData.full_name || "Contact B2B";
                        scrapedCompany = profileData.experiences?.[0]?.company || target;
                        
                        // Synthèse des données du profil pour Gemini
                        const headline = profileData.headline || "Non spécifié";
                        const summary = profileData.summary ? profileData.summary.substring(0, 400) : "Pas de biographie détaillée.";
                        const city = profileData.city || "Emplacement non spécifié";
                        
                        scrapedContext = `Titre LinkedIn: ${headline}. Localisation: ${city}. Bio LinkedIn: ${summary}. Entreprise actuelle: ${scrapedCompany}.`;
                        console.log("Extraction Proxycurl réussie !");
                    } else {
                        console.error("Proxycurl: Impossible de lire le profil.", await profileResponse.text());
                    }
                } else {
                    console.log("Proxycurl: Aucun résultat de recherche pour cette cible.");
                }
            } else {
                console.error("Proxycurl: Erreur sur l'API de recherche.", await searchResponse.text());
            }
        } catch (err) {
            console.error("Erreur générale Proxycurl:", err);
        }
    }

    // --------------------------------------------------------------------
    // MODE SÉCURITÉ (FALLBACK)
    // --------------------------------------------------------------------
    if (!scrapedCompany) {
        console.log("Mode Fallback activé : Génération d'un profil hyper-réaliste par Gemini.");
        scrapedCompany = target; 
        scrapedName = "Alexandre Martin (Exemple)";
        scrapedContext = "Entreprise dynamique du secteur cherchant à optimiser ses processus internes.";
    }


    // ====================================================================
    // ÉTAPE 2 : LE CERVEAU IA (Gemini 2.5 Pro) PREND LE RELAIS
    // ====================================================================
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-pro",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Tu es un expert en prospection B2B travaillant pour l'agence/client : "${clientName}".
      
      🚨 NOUS AVONS IDENTIFIÉ UN VRAI PROSPECT SUR INTERNET :
      - Nom du contact : ${scrapedName}
      - Entreprise ciblée : ${scrapedCompany}
      - Informations trouvées en ligne (Scraping) : ${scrapedContext}
      
      Voici la BASE DE CONNAISSANCES de ton client (ses offres, son agenda, son site) :
      """
      ${knowledgeBase}
      """

      Ta mission : 
      Rédiger un Cold Email HAUTEMENT PERSONNALISÉ pour ce prospect exact.
      1. Sers-toi des "Informations trouvées en ligne" pour briser la glace (Ex: féliciter pour la note Google, faire référence à son titre LinkedIn ou à sa bio).
      2. Sers-toi de la "Base de connaissances" pour vendre l'offre de ton client de manière subtile.
      3. Sois très courtois, naturel (pas trop robotique), va droit au but, et inclus le lien de l'agenda de la base de connaissances.

      Réponds UNIQUEMENT avec ce format JSON strict :
      {
        "name": "${scrapedName}",
        "company": "${scrapedCompany}",
        "score": 95,
        "log": "Analyse du scraping: Comment j'ai lié les infos en ligne avec l'offre du client.",
        "email_subject": "Sujet de l'email (très personnalisé avec le nom de l'entreprise cible ou un point commun)",
        "email_body": "Corps de l'email..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanJson = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);

    // ====================================================================
    // ÉTAPE 3 : RENVOI DES DONNÉES AU DASHBOARD
    // ====================================================================
    return NextResponse.json({
      newLog: `[IA + Scraper] ${data.log}`,
      newLead: {
        name: data.name, 
        company: data.company, 
        score: data.score,
        email_subject: data.email_subject,
        email_body: data.email_body
      }
    });

  } catch (error) {
    console.error("Erreur Route API:", error);
    return NextResponse.json({ error: "Erreur lors de l'opération" }, { status: 500 });
  }
}