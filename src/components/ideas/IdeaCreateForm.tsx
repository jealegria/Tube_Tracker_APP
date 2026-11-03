import React, { useState, useRef } from 'react';
import {
  Plus,
  Link2,
  Upload,
  ClipboardPaste,
  Loader2,
  StickyNote,
  AlertCircle,
} from 'lucide-react';
import { VideoIdea } from '../../types';
import {
  extractYouTubeId,
  fetchYouTubeInfo,
  getCanonicalWatchUrl,
  getThumbnailUrls,
} from '../../utils/youtube';
import { compressThumbnailFile } from '../../utils/imageCompression';

export interface IdeaCreateFormProps {
  theme: 'dark' | 'light';
  nextIdeaNumber: number;
  onAddIdea: (input: {
    sourceType: 'url' | 'upload';
    videoUrl?: string;
    videoId?: string;
    thumbnailUrl: string;
    titles: [string, string, string, string];
    notes?: string;
  }) => Promise<VideoIdea>;
  onCancel: () => void;
}

export const IdeaCreateForm: React.FC<IdeaCreateFormProps> = ({
  theme,
  nextIdeaNumber,
  onAddIdea,
  onCancel,
}) => {
  const isLight = theme === 'light';

  const [createMode, setCreateMode] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState('');
  const [fetchedVideoId, setFetchedVideoId] = useState<string | undefined>(undefined);
  const [previewThumbnail, setPreviewThumbnail] = useState<string>('');
  const [titlesDraft, setTitlesDraft] = useState<[string, string, string, string]>([
    '',
    '',
    '',
    '',
  ]);
  const [notesDraft, setNotesDraft] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleUrlLookup = async (rawUrl: string) => {
    setUrlInput(rawUrl);
    setErrorMsg(null);

    const vid = extractYouTubeId(rawUrl);
    if (!vid) {
      return;
    }

    setFetchedVideoId(vid);
    const thumbs = getThumbnailUrls(vid);
    setPreviewThumbnail(thumbs.maxres);

    setIsFetchingUrl(true);
    try {
      const info = await fetchYouTubeInfo(vid);
      setTitlesDraft((prev) => [info.title, prev[1], prev[2], prev[3]]);
    } catch {
      // Keep manual input if fetch fails
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        await handleUrlLookup(text);
      }
    } catch {
      setErrorMsg('No se pudo leer el portapapeles. Pega el link con Ctrl+V.');
    }
  };

  const handleImageFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }
    setErrorMsg(null);
    setIsFetchingUrl(true);
    try {
      const compressed = await compressThumbnailFile(file);
      setPreviewThumbnail(compressed);
    } catch {
      setErrorMsg('Error al comprimir la imagen.');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let finalThumb = previewThumbnail;
    let finalVideoId = fetchedVideoId;
    let finalVideoUrl: string | undefined = undefined;
    const finalTitles: [string, string, string, string] = [
      titlesDraft[0].trim(),
      titlesDraft[1].trim(),
      titlesDraft[2].trim(),
      titlesDraft[3].trim(),
    ];

    if (createMode === 'url') {
      const vid = extractYouTubeId(urlInput);
      if (!vid) {
        setErrorMsg('Introduce un link válido de YouTube o cambia a "Subir Imagen".');
        return;
      }
      finalVideoId = vid;
      finalVideoUrl = getCanonicalWatchUrl(vid);
      if (!finalThumb) {
        finalThumb = getThumbnailUrls(vid).maxres;
      }
      if (!finalTitles[0]) {
        setIsSaving(true);
        try {
          const info = await fetchYouTubeInfo(vid);
          finalTitles[0] = info.title;
        } catch {
          finalTitles[0] = `Video de YouTube (${vid})`;
        }
      }
    } else {
      if (!finalThumb) {
        setErrorMsg('Sube una imagen para la miniatura de tu idea.');
        return;
      }
    }

    setIsSaving(true);
    try {
      await onAddIdea({
        sourceType: createMode,
        videoId: finalVideoId,
        videoUrl: finalVideoUrl,
        thumbnailUrl: finalThumb,
        titles: finalTitles,
        notes: notesDraft.trim() || undefined,
      });
      onCancel();
    } catch {
      setErrorMsg('Ocurrió un error al guardar la idea.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleCreateSubmit}
      className={`rounded-2xl border p-5 space-y-4 animate-in fade-in duration-150 ${
        isLight
          ? 'bg-white border-neutral-300 shadow-lg'
          : 'bg-[#161616] border-neutral-700/80 shadow-2xl'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-neutral-800/60">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Crear Idea #{nextIdeaNumber}</span>
          <span className="text-xs text-neutral-500">
            — Elige subir URL de YouTube o subir una imagen
          </span>
        </div>

        {/* Source Type Selector */}
        <div
          className={`inline-flex rounded-xl p-1 border ${
            isLight
              ? 'bg-neutral-100 border-neutral-200'
              : 'bg-neutral-900 border-neutral-800'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setCreateMode('url');
              setErrorMsg(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              createMode === 'url'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Pegar URL de YouTube</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setCreateMode('upload');
              setErrorMsg(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              createMode === 'upload'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Imagen</span>
          </button>
        </div>
      </div>

      {/* URL Input Row when createMode === 'url' */}
      {createMode === 'url' && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400">
            Enlace del video de YouTube (completará automáticamente la miniatura y el Título 1)
          </label>
          <div className="relative flex items-center">
            <Link2 className="w-4 h-4 text-neutral-500 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => void handleUrlLookup(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`w-full border rounded-xl pl-10 pr-28 py-2.5 text-xs sm:text-sm outline-none transition-all ${
                isLight
                  ? 'bg-neutral-50 border-neutral-300 focus:border-red-500 text-neutral-900'
                  : 'bg-neutral-950 border-neutral-800 focus:border-red-500/70 text-white'
              }`}
              autoFocus
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              {isFetchingUrl && (
                <Loader2 className="w-4 h-4 text-red-500 animate-spin mr-1" />
              )}
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Pegar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sketch Preview & Editable Fields: Left Thumbnail + Right 4 Titles */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4">
        {/* Left Rectangle: Thumbnail Preview / Uploader */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0">
          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageFileSelect(file);
            }}
          />
          <div
            onClick={() => {
              if (createMode === 'upload') {
                uploadInputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                setCreateMode('upload');
                void handleImageFileSelect(file);
              }
            }}
            className={`aspect-video w-full rounded-xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center relative transition-colors ${
              createMode === 'upload' ? 'cursor-pointer' : ''
            } ${
              previewThumbnail
                ? 'border-transparent'
                : isLight
                ? 'bg-sky-50/70 border-sky-300 hover:border-sky-500 text-sky-800'
                : 'bg-sky-950/20 border-sky-500/40 hover:border-sky-400 text-sky-300'
            }`}
          >
            {previewThumbnail ? (
              <>
                <img
                  src={previewThumbnail}
                  alt="Vista previa de miniatura"
                  className="w-full h-full object-cover"
                />
                {createMode === 'upload' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      uploadInputRef.current?.click();
                    }}
                    className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cambiar imagen</span>
                  </button>
                )}
              </>
            ) : (
              <div className="p-6 text-center space-y-2">
                {createMode === 'url' ? (
                  <>
                    <Link2 className="w-8 h-8 mx-auto opacity-80" />
                    <p className="text-xs font-semibold">
                      Miniatura del video (16:9)
                    </p>
                    <p className="text-[11px] opacity-75">
                      Se cargará automáticamente al pegar el link de YouTube arriba
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto opacity-80" />
                    <p className="text-xs font-semibold">
                      Haz clic o arrastra una imagen aquí
                    </p>
                    <p className="text-[11px] opacity-75">
                      JPG, PNG o WebP — se optimizará a 16:9 HD
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right 4 Yellow Rectangles: 4 Editable Title Inputs */}
        <div className="flex-1 flex flex-col justify-between gap-2.5">
          {[0, 1, 2, 3].map((slotIdx) => (
            <div
              key={slotIdx}
              className={`flex items-center rounded-xl border flex-1 min-h-[46px] px-3 py-1.5 transition-colors ${
                isLight
                  ? 'bg-amber-50/70 border-amber-300 focus-within:border-amber-500 focus-within:bg-white'
                  : 'bg-amber-500/[0.07] border-amber-500/30 focus-within:border-amber-400 focus-within:bg-neutral-900'
              }`}
            >
              <span className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[11px] font-bold flex items-center justify-center shrink-0 mr-2.5">
                {slotIdx + 1}
              </span>
              <input
                type="text"
                value={titlesDraft[slotIdx]}
                onChange={(e) => {
                  const val = e.target.value;
                  setTitlesDraft((prev) => {
                    const next: [string, string, string, string] = [...prev] as [
                      string,
                      string,
                      string,
                      string,
                    ];
                    next[slotIdx] = val;
                    return next;
                  });
                }}
                placeholder={
                  slotIdx === 0 && createMode === 'url'
                    ? 'Título 1 (se autocompleta con el título del URL)...'
                    : `Opción de título #${slotIdx + 1}...`
                }
                className={`w-full bg-transparent text-xs sm:text-sm font-medium outline-none ${
                  isLight
                    ? 'text-neutral-900 placeholder:text-neutral-400'
                    : 'text-neutral-100 placeholder:text-neutral-500'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Optional Note Input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
          <StickyNote className="w-3.5 h-3.5 text-amber-400" />
          <span>Nota de la idea (opcional)</span>
        </label>
        <input
          type="text"
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          placeholder="Ej: Adaptar este concepto al nicho local, probar miniatura con texto corto..."
          className={`w-full border rounded-xl px-3.5 py-2 text-xs outline-none ${
            isLight
              ? 'bg-neutral-50 border-neutral-300 focus:border-neutral-500 text-neutral-900'
              : 'bg-neutral-950 border-neutral-800 focus:border-neutral-700 text-neutral-200'
          }`}
        />
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-3.5 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
            isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
          }`}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSaving || isFetchingUrl}
          className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Guardando Idea...</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Guardar Idea</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
