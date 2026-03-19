'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, Camera, FileText, Image, X, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  selectedFile: File | null;
  onClear: () => void;
}

export default function FileUpload({
  onFileSelected,
  isProcessing,
  selectedFile,
  onClear,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && isValidFile(file)) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isValidFile(file)) {
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const isValidFile = (file: File) => {
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
    ];
    return validTypes.includes(file.type) || file.name.endsWith('.heic');
  };

  if (selectedFile) {
    const isPdf = selectedFile.type === 'application/pdf';
    return (
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPdf ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
                <FileText className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <Image className="h-5 w-5" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-stone-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-stone-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isProcessing && (
              <div className="flex items-center gap-2 text-sm text-primary-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Wird verarbeitet...</span>
              </div>
            )}
            {!isProcessing && (
              <button
                onClick={onClear}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`card cursor-pointer border-2 border-dashed p-8 text-center transition-all ${
        isDragging
          ? 'border-primary-400 bg-primary-50'
          : 'border-stone-300 hover:border-primary-300 hover:bg-stone-50'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
          <Upload className="h-7 w-7" />
        </div>
        <div>
          <p className="text-sm font-semibold text-stone-700">
            Datei hierher ziehen oder klicken
          </p>
          <p className="mt-1 text-xs text-stone-500">
            PDF, JPG, PNG, WebP oder HEIC
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="btn-secondary text-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            Datei wählen
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              cameraInputRef.current?.click();
            }}
            className="btn-secondary text-xs"
          >
            <Camera className="h-3.5 w-3.5" />
            Kamera
          </button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
