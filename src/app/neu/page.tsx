'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import OcrReview from '@/components/OcrReview';
import CategorySelector from '@/components/CategorySelector';
import { OcrResult } from '@/types';

type Step = 'upload' | 'ocr' | 'manual';

export default function NewRecipePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    fileUrl: string;
    fileType: string;
  } | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Manual entry state
  const [manualTitle, setManualTitle] = useState('');
  const [manualIngredients, setManualIngredients] = useState('');

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setError('');

    try {
      // 1. Upload file
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload fehlgeschlagen');
      const uploadData = await uploadRes.json();
      setUploadedFile(uploadData);

      // 2. Run OCR
      const ocrRes = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: uploadData.fileUrl,
          fileType: uploadData.fileType,
        }),
      });

      if (!ocrRes.ok) throw new Error('Texterkennung fehlgeschlagen');
      const ocrData = await ocrRes.json();
      setOcrResult(ocrData);
      setStep('ocr');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveRecipe = async (title: string, ingredients: string[]) => {
    setIsSaving(true);
    setError('');

    try {
      const res = await fetch('/api/rezepte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          ingredients,
          ocrRawText: ocrResult?.rawText || null,
          fileUrl: uploadedFile?.fileUrl || null,
          fileType: uploadedFile?.fileType || null,
          categoryIds,
        }),
      });

      if (!res.ok) throw new Error('Speichern fehlgeschlagen');
      const recipe = await res.json();
      router.push(`/rezepte/${recipe.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      );
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    const ingredients = manualIngredients
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    await handleSaveRecipe(manualTitle || 'Unbenanntes Rezept', ingredients);
  };

  const resetForm = () => {
    setStep('upload');
    setSelectedFile(null);
    setUploadedFile(null);
    setOcrResult(null);
    setCategoryIds([]);
    setError('');
    setManualTitle('');
    setManualIngredients('');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Neues Rezept</h1>
        <p className="mt-1 text-sm text-stone-500">
          Lade ein Foto oder PDF hoch, oder gib das Rezept manuell ein.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => step !== 'upload' && resetForm()}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            step === 'upload' || step === 'ocr'
              ? 'bg-primary-50 text-primary-700'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Mit Datei
        </button>
        <button
          onClick={() => {
            resetForm();
            setStep('manual');
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
            step === 'manual'
              ? 'bg-primary-50 text-primary-700'
              : 'text-stone-500 hover:bg-stone-100'
          }`}
        >
          <Plus className="h-4 w-4" />
          Manuell
        </button>
      </div>

      {/* File upload step */}
      {(step === 'upload' || step === 'ocr') && (
        <FileUpload
          onFileSelected={handleFileSelected}
          isProcessing={isProcessing}
          selectedFile={selectedFile}
          onClear={resetForm}
        />
      )}

      {/* Preview of uploaded file */}
      {uploadedFile && step === 'ocr' && (
        <div className="card overflow-hidden">
          <div className="border-b border-stone-100 px-5 py-3">
            <h3 className="text-sm font-medium text-stone-700">
              Originaldokument
            </h3>
          </div>
          <div className="p-2">
            {uploadedFile.fileType === 'pdf' ? (
              <iframe
                src={uploadedFile.fileUrl}
                className="h-96 w-full rounded-xl"
                title="PDF Vorschau"
              />
            ) : (
              <img
                src={uploadedFile.fileUrl}
                alt="Rezept"
                className="max-h-96 w-full rounded-xl object-contain"
              />
            )}
          </div>
        </div>
      )}

      {/* Category selection */}
      {(step === 'ocr' || step === 'manual') && (
        <div className="card p-5">
          <CategorySelector
            selectedIds={categoryIds}
            onChange={setCategoryIds}
          />
        </div>
      )}

      {/* OCR Review step */}
      {step === 'ocr' && ocrResult && (
        <OcrReview
          ocrResult={ocrResult}
          onConfirm={handleSaveRecipe}
          onCancel={resetForm}
        />
      )}

      {/* Manual entry step */}
      {step === 'manual' && (
        <div className="card divide-y divide-stone-100">
          <div className="p-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-700">
                Rezepttitel
              </label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="input"
                placeholder="z.B. Spaghetti Carbonara"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-stone-700">
                Zutaten (eine pro Zeile)
              </label>
              <textarea
                value={manualIngredients}
                onChange={(e) => setManualIngredients(e.target.value)}
                className="input min-h-[200px] resize-y"
                placeholder={`200g Spaghetti\n100g Guanciale\n2 Eigelb\n50g Pecorino\nPfeffer`}
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 p-5">
            <button onClick={resetForm} className="btn-ghost">
              Abbrechen
            </button>
            <button
              onClick={handleManualSave}
              disabled={isSaving || !manualTitle.trim()}
              className="btn-primary"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Rezept speichern
            </button>
          </div>
        </div>
      )}

      {isSaving && step === 'ocr' && (
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Wird gespeichert...
        </div>
      )}
    </div>
  );
}
