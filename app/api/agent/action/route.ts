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

    // SCRAPING UNIQUEMENT SI CE N'EST PAS UNE GÉNÉRATION MANUELLE SPÉCIFIQUE
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
        else if (!isLocalBusiness && process.env.NINJAPEAR_API_KEY) {
            // NOUVELLE LOGIQUE NINJAPEAR
            try {
                // NinjaPear fonctionne de manière ultra-ciblée via un nom de domaine.
                // On transforme intelligemment la "cible" en domaine potentiel (ex: "Shopify" -> "shopify.com")
                let domain = target.includes('.') ? target : target.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
                
                // 1. Appel à NinjaPear pour obtenir les données de l'entreprise
                const companyUrl = `https://nubela.co/api/v1/company/details?website=${encodeURIComponent(domain)}`; 
                const companyResponse = await fetch(companyUrl, { headers: { 'Authorization': `Bearer ${process.env.NINJAPEAR_API_KEY}` } });
                
                if (companyResponse.ok) {
                    const companyData = await companyResponse.json();
                    scrapedCompany = companyData.name || domain; 
                    
                    // 2. Appel à NinjaPear pour trouver le profil d'un dirigeant (ex: CEO)
                    const employeeUrl = `https://nubela.co/api/v1/employee/profile?employer_website=${encodeURIComponent(domain)}&role=CEO`;
                    const employeeResponse = await fetch(employeeUrl, { headers: { 'Authorization': `Bearer ${process.env.NINJAPEAR_API_KEY}` } });
                    
                    if (employeeResponse.ok) {
                        const employeeData = await employeeResponse.json();
                        scrapedName = employeeData.full_name || "Direction";
                        scrapedContext = `Industrie: ${companyData.industry || 'Tech'}. Employés: ${companyData.employee_count || 'N/A'}. HQ: ${companyData.headquarters || 'N/A'}. Profil CEO: ${employeeData.bio || 'Non spécifié'}.`;
                    } else {
                        scrapedName = "Direction";
                        scrapedContext = `Industrie: ${companyData.industry || 'Tech'}. Employés: ${companyData.employee_count || 'N/A'}. HQ: ${companyData.headquarters || 'N/A'}.`;
                    }
                }
            } catch (err) { console.error("Erreur NinjaPear:", err); }
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
      Si le prospect ci-dessous est dans la liste, invente une autre entreprise fictive correspondant à la cible "${target}".

      - Contact : ${scrapedName}
      - Entreprise : ${scrapedCompany}
      - Infos : ${scrapedContext}
      
      Base de connaissances : """${knowledgeBase}"""

      Ta mission : 
      1. Rédige ${emailType}.
      2. ⚠️ EXTRACTION DE COORDONNÉES : Déduis ou extrais l'adresse e-mail, le téléphone et l'adresse postale à partir des "Infos". S'ils sont introuvables, génère des coordonnées professionnelles PLAUSIBLES ET CRÉDIBLES (ex: contact@entreprise.com) pour la démo.
      3. ⚠️ SIGNATURE OBLIGATOIRE : Signe l'e-mail EXCLUSIVEMENT et EXACTEMENT avec "L'équipe ${clientName} via NTER Solutions". N'utilise jamais "[Votre nom]".

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
        email: data.email,
        phone: data.phone,
        address: data.address,
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