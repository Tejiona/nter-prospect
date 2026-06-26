import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { website, lang } = await req.json();
    if (!website) {
      return NextResponse.json({ error: 'No website provided' }, { status: 400 });
    }

    const url = website.startsWith('http') ? website : `https://${website}`;

    let textContent = '';
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; T-Prospect/1.0)' },
        signal: AbortSignal.timeout(10000),
      });
      const html = await response.text();
      textContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000);
    } catch {
      textContent = `Website domain: ${website}`;
    }

    const langInstruction = lang === 'en'
      ? 'Reply in English only.'
      : 'Réponds en français uniquement.';

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const prompt = `${langInstruction}
Analyse le contenu de ce site web et déduis en UNE SEULE phrase concise (max 15 mots) quel type de prospects/clients B2B cette entreprise devrait cibler pour sa prospection commerciale.
Retourne UNIQUEMENT la phrase de ciblage, rien d'autre. Pas de guillemets, pas de préambule.

Contenu du site : ${textContent}`;

    const result = await model.generateContent(prompt);
    const target = result.response.text().trim();

    return NextResponse.json({ target });
  } catch (error) {
    console.error('[Detect-Target] Erreur:', error);
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
  }
}
