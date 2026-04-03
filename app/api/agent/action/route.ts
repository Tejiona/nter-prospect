/* FICHIER: app/api/agent/action/route.ts */
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const target = body.target || "Entreprises locales";
    const clientName = body.clientName || "Notre agence";
    const knowledgeBase = body.knowledgeBase || "Aucune information supplémentaire fournie.";
    const existingProspects = body.existingProspects || [];
    
    const lang = body.lang || 'fr';
    const isFollowUp = body.isFollowUp || false;
    const manualName = body.manualName;
    const manualCompany = body.manualCompany;

    let scrapedName = manualName || "";
    let scrapedCompany = manualCompany || "";
    let scrapedContext = "";

    if (!manualName && !manualCompany) {
        const isLocalBusiness = target.toLowerCase().includes('restaurant') || target.toLowerCase().includes('boulangerie') || target.toLowerCase().includes('hôtel') || target.toLowerCase().includes('boutique') || target.toLowerCase().includes('agence');

        if (isLocalBusiness && process.env.GOOGLE_MAPS_API_KEY) {
            try {
                const mapsUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(target)}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
                const mapsResponse = await fetch(mapsUrl);
                const mapsData = await mapsResponse.json();
                if (mapsData.results && mapsData.results.length > 0) {
                    const place = mapsData.results.find((p: any) => !existingProspects.some((ep: string) => ep.includes(p.name))) || mapsData.results[0];
                    scrapedCompany = place.name;
                    scrapedName = "Direction"; 
                    scrapedContext = `Adresse: ${place.formatted_address}. Note Google: ${place.rating}/5.`;
                }
            } catch (err) { console.error("Erreur Google Maps :", err); }
        } 
        else if (!isLocalBusiness && process.env.PROXYCURL_API_KEY) {
            try {
                const searchUrl = `https://nubela.co/proxycurl/api/v2/search/person?keyword=${encodeURIComponent(target)}&page_size=3`; 
                const searchResponse = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${process.env.PROXYCURL_API_KEY}` } });
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    if (searchData.results && searchData.results.length > 0) {
                        const linkedInUrl = searchData.results[0].profile_url;
                        const profileResponse = await fetch(`https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedInUrl)}&use_cache=if-present`, { headers: { 'Authorization': `Bearer ${process.env.PROXYCURL_API_KEY}` } });
                        if (profileResponse.ok) {
                            const profileData = await profileResponse.json();
                            scrapedName = profileData.full_name || "Contact B2B";
                            scrapedCompany = profileData.experiences?.[0]?.company || target;
                            scrapedContext = `Titre: ${profileData.headline}. Bio: ${profileData.summary?.substring(0, 200)}. Localisation: ${profileData.city || profileData.country || 'Inconnue'}`;
                        }
                    }
                }
            } catch (err) { console.error("Erreur Proxycurl:", err); }
        }

        if (!scrapedCompany) {
            scrapedCompany = target; 
            scrapedName = "Alexandre Martin";
            scrapedContext = "Entreprise dynamique du secteur cherchant à optimiser ses processus internes.";
        }
    } else {
        scrapedContext = "Prospect inséré manuellement. Rédige un message pertinent basé sur son entreprise et l'offre de notre client.";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro", generationConfig: { responseMimeType: "application/json" } });

    const languageInstruction = lang === 'en' ? "English" : "Français";
    const emailType = isFollowUp ? "un e-mail de RELANCE (Follow-up) pertinent, court et incitatif pour relancer la conversation" : "un Cold Email HAUTEMENT PERSONNALISÉ de premier contact";

    const prompt = `
      Tu es un expert en prospection B2B travaillant pour : "${clientName}".
      Tu dois rédiger le message obligatoirement en : ${languageInstruction}.
      
      🚨 PROSPECTS DÉJÀ CONTACTÉS À IGNORER (Anti-doublon) : [${existingProspects.join(', ')}]

      - Contact : ${scrapedName}
      - Entreprise : ${scrapedCompany}
      - Infos : ${scrapedContext}
      
      Base de connaissances : """${knowledgeBase}"""

      Ta mission : 
      1. Rédige ${emailType}.
      2. ⚠️ EXTRACTION DE COORDONNÉES : Déduis ou extrais l'adresse e-mail, le téléphone et l'adresse postale à partir des "Infos". S'ils sont introuvables, génère des coordonnées professionnelles PLAUSIBLES ET CRÉDIBLES (ex: contact@entreprise.com) pour la démo.
      3. Signe l'e-mail EXCLUSIVEMENT avec "L'équipe ${clientName} via NTER Solutions".

      Format JSON strict attendu :
      {
        "name": "${scrapedName}",
        "company": "${scrapedCompany}",
        "email": "email extrait ou inventé",
        "phone": "téléphone extrait ou inventé",
        "address": "adresse extraite ou inventée",
        "score": 95,
        "log": "Analyse stratégique...",
        "email_subject": "Sujet de l'email en ${languageInstruction}",
        "email_body": "Corps du message en ${languageInstruction}..."
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanJson = response.text().replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);

    return NextResponse.json({
      newLog: `[IA] ${data.log}`,
      newLead: { 
        name: data.name, 
        company: data.company, 
        email: data.email, // NOUVEAU
        phone: data.phone, // NOUVEAU
        address: data.address, // NOUVEAU
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