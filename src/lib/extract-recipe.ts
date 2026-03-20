import Anthropic from '@anthropic-ai/sdk';
import { OcrResult } from '@/types';

const client = new Anthropic();

const RECIPE_PROMPT = `Du bist ein Rezept-Parser. Extrahiere den Rezepttitel und alle Zutaten.

Regeln:
- Gib NUR valides JSON zurück, keinen anderen Text
- Jede Zutat als ein String im Format "Menge Einheit Zutat" (z.B. "200 g Mehl", "1 TL Salz", "3 Eier")
- Korrigiere offensichtliche Fehler (z.B. "Mehi" → "Mehl", "Sa1z" → "Salz")
- Ignoriere Zubereitungsschritte, nur Zutaten extrahieren
- Wenn keine Zutaten erkennbar sind, gib ein leeres Array zurück

JSON-Format:
{"title": "Rezeptname", "ingredients": ["Zutat 1", "Zutat 2", ...]}`;

function parseResponse(text: string, rawText: string): OcrResult {
  try {
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

export async function extractRecipeFromImage(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
  const base64 = imageBuffer.toString('base64');
  const mediaType = mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: 'text',
            text: RECIPE_PROMPT,
          },
        ],
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  return parseResponse(responseText, '[Bild-Analyse]');
}

export async function extractRecipeFromText(rawText: string): Promise<OcrResult> {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `${RECIPE_PROMPT}\n\nText:\n${rawText}`,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
  return parseResponse(responseText, rawText);
}
