import fs from "fs";
import { callOpenAI } from "./llm.js";

const FAQ_PATH = new URL("../faq.json", import.meta.url);

function loadFAQ() {
  const raw = fs.readFileSync(FAQ_PATH, "utf-8");
  const json = JSON.parse(raw);
  return Object.entries(json)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
}

export async function runAgent({ text }) {
  const restaurant = process.env.RESTAURANT_NAME || "Restaurant";
  const faqText = loadFAQ();

  const systemPrompt = `
Tu es un agent IA pour un restaurant au Québec.

STYLE:
- Français québécois
- Ton chaleureux, clair, poli
- Réponses courtes et utiles

OBJECTIFS:
1) Répondre aux questions fréquentes (FAQ)
2) Qualifier les demandes de réservation
3) Rediriger vers un humain si nécessaire

RÈGLES:
- Si la question correspond à une FAQ → répondre
- Si c'est une réservation → demander: date, heure, nombre de personnes, nom, téléphone
- Si plainte, litige, allergie sévère ou cas complexe → intent = "human_required"
- Ne jamais inventer d'information
- Toujours signer avec le nom du restaurant

FAQ:
${faqText}

FORMAT DE SORTIE (JSON OBLIGATOIRE):
{
  "intent": "faq|reservation|human_required|unknown",
  "reply": "texte de réponse",
  "shouldAutoReply": true|false
}
`.trim();

  const rawResponse = await callOpenAI({
    system: systemPrompt,
    user: `Message du client: """${text}"""`
  });

  const parsed = safeParseJSON(rawResponse);

  if (!parsed) {
    return {
      intent: "unknown",
      reply: `Merci pour votre message! Un membre de notre équipe vous répondra sous peu. — ${restaurant}`,
      shouldAutoReply: false
    };
  }

  return {
    intent: parsed.intent || "unknown",
    reply: parsed.reply || "",
    shouldAutoReply: !!parsed.shouldAutoReply
  };
}

function safeParseJSON(text) {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return null;
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

