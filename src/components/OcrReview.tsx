'use client';

import { useState } from 'react';
import { Plus, X, Check, AlertCircle, Wand2, FileText } from 'lucide-react';
import { OcrResult } from '@/types';

// Korrigiert OCR-Mergefehler wie "1TLschwarzerPfeffer" → "1 TL schwarzer Pfeffer"
function fixMergedTokens(line: string): string {
  let s = line;
  // Ziffer direkt vor Buchstabe: "200g" → "200 g", "1TL" → "1 TL"
  s = s.replace(/(\d)([A-Za-zÄÖÜäöüß])/g, '$1 $2');
  // Buchstabe direkt vor Ziffer: "g200" → "g 200"
  s = s.replace(/([A-Za-zÄÖÜäöüß])(\d)/g, '$1 $2');
  // Kleinbuchstabe → Großbuchstabe (CamelCase-Merge): "schwarzerPfeffer" → "schwarzer Pfeffer"
  s = s.replace(/([a-zäöüß])([A-ZÄÖÜ][a-zäöüß])/g, '$1 $2');
  // Bekannte Einheiten direkt vor Wort: "TLschwarzer" → "TL schwarzer"
  s = s.replace(
    /\b(g|kg|mg|ml|cl|dl|EL|TL|el|tl|Stk|St|Pkg|Prise|Bund|Dose|Becher|Packung|Scheibe|Tasse|Glas|Zehe|Zweig)([A-Za-zÄÖÜäöüß])/g,
    '$1 $2'
  );
  // Mehrfache Leerzeichen bereinigen
  return s.replace(/  +/g, ' ').trim();
}

interface OcrReviewProps {
  ocrResult: OcrResult;
  onConfirm: (title: string, ingredients: string[]) => void;
  onCancel: () => void;
}

export default function OcrReview({
  ocrResult,
  onConfirm,
  onCancel,
}: OcrReviewProps) {
  const [title, setTitle] = useState(ocrResult.title);
  const [ingredients, setIngredients] = useState<string[]>(
    ocrResult.ingredients.length > 0 ? ocrResult.ingredients : []
  );
  const [newIngredient, setNewIngredient] = useState('');
  const [rawText, setRawText] = useState(ocrResult.rawText || '');
  const [showRawText, setShowRawText] = useState(false);
  const [extractHint, setExtractHint] = useState(false);

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  // Extract ingredients between ZUTATEN and ENDE markers
  const extractFromMarkers = () => {
    const lines = rawText.split('\n');
    const start = lines.findIndex((l) =>
      l.trim().toUpperCase() === 'ZUTATEN'
    );
    const end = lines.findIndex((l) =>
      l.trim().toUpperCase() === 'ENDE'
    );

    if (start === -1 || end === -1 || end <= start) {
      setExtractHint(true);
      setTimeout(() => setExtractHint(false), 3000);
      return;
    }

    const extracted = lines
      .slice(start + 1, end)
      .map((l) => fixMergedTokens(l.trim()))
      .filter((l) => l.length > 0);

    setIngredients(extracted);
    setExtractHint(false);
  };

  const handleConfirm = () => {
    const filtered = ingredients.filter((i) => i.trim().length > 0);
    onConfirm(title.trim() || 'Unbenanntes Rezept', filtered);
  };

  return (
    <div className="card divide-y divide-stone-100">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              OCR-Ergebnis prüfen
            </h3>
            <p className="text-xs text-stone-500">
              Überprüfe die Daten und korrigiere sie bei Bedarf.
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-stone-700">
            Rezepttitel
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            placeholder="Rezeptname eingeben..."
          />
        </div>

        {/* Ingredients */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium text-stone-700">
              Zutaten ({ingredients.filter((i) => i.trim()).length})
            </label>
            {ingredients.length > 0 && (
              <button
                onClick={() => setIngredients([])}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Alle löschen
              </button>
            )}
          </div>

          {ingredients.length === 0 ? (
            <p className="py-3 text-xs text-stone-400 italic">
              Noch keine Zutaten. Nutze den Originaltext unten oder füge sie manuell hinzu.
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => updateIngredient(index, e.target.value)}
                    className="input flex-1 py-2 text-sm"
                    placeholder="Zutat..."
                  />
                  <button
                    onClick={() => removeIngredient(index)}
                    className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
              className="input flex-1 py-2 text-sm"
              placeholder="Zutat manuell hinzufügen..."
            />
            <button onClick={addIngredient} className="btn-secondary py-2">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Raw text - editable + extract button */}
      <div className="p-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowRawText(!showRawText)}
            className="flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-700"
          >
            <FileText className="h-3.5 w-3.5" />
            {showRawText ? 'Originaltext verbergen' : 'Originaltext bearbeiten'}
          </button>
          {showRawText && (
            <button
              onClick={extractFromMarkers}
              className="flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-100"
            >
              <Wand2 className="h-3.5 w-3.5" />
              Zutaten extrahieren
            </button>
          )}
        </div>

        {showRawText && (
          <div className="mt-3 space-y-2">
            {/* Instructions */}
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-3 text-xs text-primary-800">
              <p className="font-semibold mb-1">So geht's:</p>
              <ol className="space-y-0.5 list-decimal list-inside">
                <li>Schreibe <strong>ZUTATEN</strong> in eine eigene Zeile (vor die Zutaten)</li>
                <li>Schreibe <strong>ENDE</strong> in eine eigene Zeile (nach den Zutaten)</li>
                <li>Klicke auf <strong>„Zutaten extrahieren"</strong></li>
              </ol>
            </div>

            {extractHint && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-2 text-xs text-red-700">
                Marker nicht gefunden. Bitte schreibe ZUTATEN und ENDE in eigene Zeilen.
              </div>
            )}

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="input min-h-[240px] resize-y font-mono text-xs"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 p-5">
        <button onClick={onCancel} className="btn-ghost">
          Abbrechen
        </button>
        <button onClick={handleConfirm} className="btn-primary">
          <Check className="h-4 w-4" />
          Rezept speichern
        </button>
      </div>
    </div>
  );
}
