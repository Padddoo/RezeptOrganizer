import Tesseract from 'tesseract.js';
import pdf from 'pdf-parse';
import { OcrResult } from '@/types';

export async function extractTextFromImage(imagePath: string): Promise<string> {
  const result = await Tesseract.recognize(imagePath, 'deu+eng', {
    logger: () => {},
  });
  return result.data.text;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Fix common OCR merge artifacts where spaces are missing.
 * Examples: "1TLschwarzerPfeffer" → "1 TL schwarzer Pfeffer"
 *           "200gMehl"            → "200 g Mehl"
 *           "½TLSalz"             → "½ TL Salz"
 */
function fixMergedTokens(text: string): string {
  return text
    .split('\n')
    .map((line) => {
      let s = line;
      // 1. Digit directly followed by a letter: "200g" → "200 g", "1TL" → "1 TL"
      s = s.replace(/(\d)([A-Za-zÄÖÜäöüß])/g, '$1 $2');
      // 2. Letter directly followed by a digit: "g200" → "g 200"
      s = s.replace(/([A-Za-zÄÖÜäöüß])(\d)/g, '$1 $2');
      // 3. Lowercase → Uppercase boundary (CamelCase merge): "schwarzerPfeffer" → "schwarzer Pfeffer"
      //    Skip umlauts followed by capital to avoid breaking German compound words less aggressively
      s = s.replace(/([a-zäöüß])([A-ZÄÖÜ][a-zäöüß])/g, '$1 $2');
      // 4. Known unit abbreviations glued to next word: "TLschwarz" → "TL schwarz"
      //    No \b after unit because it's directly followed by a letter (no boundary)
      s = s.replace(
        /\b(g|kg|mg|ml|cl|dl|EL|TL|el|tl|Stk|St|Pkg|Prise|Bund|Dose|Becher|Packung|Scheibe|Tasse|Glas|Zehe|Zweig)([A-Za-zÄÖÜäöüß])/g,
        '$1 $2'
      );
      // 5. Collapse multiple spaces
      s = s.replace(/  +/g, ' ').trim();
      return s;
    })
    .join('\n');
}

// German and English units
const UNITS =
  'g|kg|mg|ml|l|cl|dl|EL|TL|el|tl|Stück|Stk|St|Prise|Prisen|Bund|Dose|Dosen|' +
  'Becher|Packung|Pkg|Scheibe|Scheiben|Tasse|Tassen|Glas|Gläser|Zehe|Zehen|' +
  'Zweig|Zweige|Blatt|Blätter|Handvoll|Spritzer|Tropfen|' +
  'cup|cups|tbsp|tsp|oz|lb|lbs|bunch|can|slice|slices|clove|cloves|' +
  'piece|pieces|pinch|dash|handful|sprig|leaf|leaves';

// Quantity patterns: "200", "1/2", "½", "2-3", "ca. 3", "1,5"
const QUANTITY = '(?:ca\\.?\\s*)?(?:\\d+[,.]\\d+|\\d+\\s*[-–]\\s*\\d+|\\d+\\s*/\\s*\\d+|[\\u00BD\\u2153-\\u215E]|\\d+)';

// Ingredient detection regex (quantity + optional unit + ingredient name)
const INGREDIENT_REGEX = new RegExp(
  `^${QUANTITY}\\s*(?:${UNITS})\\.?\\s+\\S`,
  'i'
);

// Ingredient starting with just a number (e.g. "3 Eier", "2 Knoblauchzehen", "1 rote Zwiebel")
const INGREDIENT_COUNT_REGEX = new RegExp(
  `^${QUANTITY}\\s+[A-Za-zÄÖÜäöüß]`,
  ''
);

// Lines that are NOT ingredients (preparation verbs, section headers, etc.)
const PREPARATION_WORDS =
  /^(zubereitung|anleitung|preparation|instructions?|directions?|so geht|schritt|step|methode|method|tip|tipp|hinweis|note|für den|für die|für das|sauce|dressing|garnitur|topping|beilage)/i;

const SECTION_HEADERS =
  /^(zutaten|ingredients?|für \d|for \d|portionen|servings?|personen|persons?)/i;

const SKIP_LINES =
  /^(www\.|http|©|seite|page|\d+\s*$|rezept|recipe|autor|author|quelle|source|minuten|minute|stunden|hour|°c|°f|kcal|kalorien)/i;

function looksLikeIngredient(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2 || trimmed.length > 120) return false;
  if (PREPARATION_WORDS.test(trimmed)) return false;
  if (SKIP_LINES.test(trimmed)) return false;

  // Has a unit → almost certainly an ingredient
  if (INGREDIENT_REGEX.test(trimmed)) return true;

  // Starts with a number + ingredient name (e.g. "3 Eier", "2 Zwiebeln")
  if (INGREDIENT_COUNT_REGEX.test(trimmed)) return true;

  // Fraction / vulgar fraction at start (½ Zitrone, ¼ TL Salz)
  if (/^[½¼¾⅓⅔⅛⅜⅝⅞]/.test(trimmed)) return true;

  return false;
}

function cleanIngredientLine(line: string): string {
  return line
    .replace(/^[-–•*·▪▸►▶◆○●]\s*/, '') // bullet points
    .replace(/^\d+[.)]\s+(?=\D)/, '')    // numbered list markers like "1. " but not "100g"
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseRecipeText(rawText: string): OcrResult {
  // Fix OCR merge artifacts before parsing
  const fixedText = fixMergedTokens(rawText);

  const lines = fixedText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // ── Find title ────────────────────────────────────────────────────────────
  let title = '';
  for (const line of lines.slice(0, 8)) {
    if (
      SECTION_HEADERS.test(line) ||
      SKIP_LINES.test(line) ||
      looksLikeIngredient(line) ||
      line.length < 3
    ) continue;
    title = line;
    break;
  }

  // ── Extract ingredients ───────────────────────────────────────────────────
  const ingredients: string[] = [];
  let inIngredientsSection = false;
  let inPreparationSection = false;
  let consecutiveNonIngredients = 0;

  for (const line of lines) {
    // Detect section headers
    if (SECTION_HEADERS.test(line)) {
      inIngredientsSection = true;
      inPreparationSection = false;
      consecutiveNonIngredients = 0;
      continue;
    }

    if (PREPARATION_WORDS.test(line)) {
      inPreparationSection = true;
      inIngredientsSection = false;
      continue;
    }

    if (inPreparationSection) continue;

    const cleaned = cleanIngredientLine(line);
    if (!cleaned) continue;

    if (inIngredientsSection) {
      // Inside a labeled ingredient section: be permissive.
      // Accept any short line that isn't noise or a preparation step.
      if (SKIP_LINES.test(cleaned)) {
        // skip noise lines (URLs, page numbers, etc.)
      } else if (cleaned.length > 100) {
        // Very long lines are preparation sentences — stop section
        consecutiveNonIngredients++;
        if (consecutiveNonIngredients >= 2) inIngredientsSection = false;
      } else if (cleaned.endsWith('.') && cleaned.length > 40) {
        // Long sentences ending with period → probably preparation
        consecutiveNonIngredients++;
        if (consecutiveNonIngredients >= 2) inIngredientsSection = false;
      } else {
        // Accept as ingredient (includes "Salz und Pfeffer", "etwas Olivenöl", etc.)
        ingredients.push(cleaned);
        consecutiveNonIngredients = 0;
      }
    } else {
      // Outside a labeled section: only add if it clearly looks like an ingredient
      if (looksLikeIngredient(cleaned) && !SKIP_LINES.test(cleaned)) {
        const alreadyAdded = ingredients.some(
          (i) => i.toLowerCase() === cleaned.toLowerCase()
        );
        if (!alreadyAdded) {
          ingredients.push(cleaned);
        }
      }
    }
  }

  return {
    rawText: fixedText,
    title: title || 'Unbenanntes Rezept',
    ingredients,
  };
}
