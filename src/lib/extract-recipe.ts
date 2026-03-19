import Anthropic from '@anthropic-ai/sdk';
import { OcrResult } from '@/types';

const client = new Anthropic();

export async function extractRecipeWithAI(rawText: string): Promise<OcrResult> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Du bist ein Rezept-Parser. Extrahiere aus dem folgenden OCR-Text den Rezepttitel und alle Zutaten.

Regeln:
- Gib NUR valides JSON zurück, keinen anderen Text
- Jede Zutat als ein String im Format "Menge Einheit Zutat" (z.B. "200 g Mehl", "1 TL Salz", "3 Eier")
- Korrigiere offensichtliche OCR-Fehler (z.B. "Mehi" → "Mehl", "Sa1z" → "Salz")
- Ignoriere Zubereitungsschritte, nur Zutaten extrahieren
- Wenn keine Zutaten erkennbar sind, gib ein leeres Array zurück

JSON-Format:
{"title": "Rezeptname", "ingredients": ["Zutat 1", "Zutat 2", ...]}

OCR-Text:
${rawText}`,
      },
    ],
  });

  try {
    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    // Extract JSON from response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { rawText, title: 'Unbenanntes Rezept', ingredients: [] };
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      rawText,
      title: parsed.title || 'Unbenanntes Rezept',
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
    };
  } catch {
    return { rawText, title: 'Unbenanntes Rezept', ingredients: [] };
  }
}
