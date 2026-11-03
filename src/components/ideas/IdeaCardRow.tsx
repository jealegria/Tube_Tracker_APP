import React, { useState, useEffect, useRef } from 'react';
import {
  Link2,
  Upload,
  Loader2,
  Trash2,
  StickyNote,
  ExternalLink,
  Check,
  Copy,
  Image as ImageIcon,
  X,
  RefreshCw,
} from 'lucide-react';
import { VideoIdea } from '../../types';
import {
  extractYouTubeId,
  fetchYouTubeInfo,
  getCanonicalWatchUrl,
  getThumbnailUrls,
} from '../../utils/youtube';
import { compressThumbnailFile } from '../../utils/imageCompression';

export interface IdeaCardRowProps {
  idea: VideoIdea;
  index: number;
  totalCount: number;
  theme: 'dark' | 'light';
  onUpdateIdea: (
    ideaId: string,
    patch: Partial<
      Pick<
        VideoIdea,
        'sourceType' | 'videoUrl' | 'videoId' | 'thumbnailUrl' | 'titles' | 'notes'
      >
    >
  ) => Promise<void>;
  onDeleteIdea: (ideaId: string) => Promise<void>;
}

export const IdeaCardRow: React.FC<IdeaCardRowProps> = ({
  idea,
  index,
  totalCount,
  theme,
  onUpdateIdea,
  onDeleteIdea,
}) => {
  const isLight = theme === 'light';
  const ideaNumber = totalCount - index;

  const [localTitles, setLocalTitles] = useState<[string, string, string, string]>(idea.titles);
  const [localNotes, setLocalNotes] = useState<string>(idea.notes || '');
  const [savedIndicator, setSavedIndicator] = useState<number | 'notes' | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Thumbnail editing state
  const [isEditingThumb, setIsEditingThumb] = useState(false);
  const [thumbMode, setThumbMode] = useState<'url' | 'upload'>(idea.sourceType);
  const [urlDraft, setUrlDraft] = useState(idea.videoUrl || '');
  const [isThumbLoading, setIsThumbLoading] = useState(false);
  const [thumbError, setThumbError] = useState<string | null>(null);
  const [imgFallbackStage, setImgFallbackStage] = useState<0 | 1>(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLocalTitles(idea.titles);
  }, [idea.titles]);

  useEffect(() => {
    setLocalNotes(idea.notes || '');
  }, [idea.notes]);

  useEffect(() => {
    setImgFallbackStage(0);
  }, [idea.thumbnailUrl]);

  const handleTitleChange = (slotIdx: number, val: string) => {
    setLocalTitles((prev) => {
      const next: [string, string, string, string] = [...prev] as [string, string, string, string];
      next[slotIdx] = val;
      return next;
    });
  };

  const commitTitle = async (slotIdx: number) => {
    const trimmed = localTitles[slotIdx].trim();
    if (trimmed === (idea.titles[slotIdx] || '')) return;

    const nextTitles: [string, string, string, string] = [
      localTitles[0].trim(),
      localTitles[1].trim(),
      localTitles[2].trim(),
      localTitles[3].trim(),
    ];
    await onUpdateIdea(idea.id, { titles: nextTitles });
    setSavedIndicator(slotIdx);
    setTimeout(() => {
      setSavedIndicator((curr) => (curr === slotIdx ? null : curr));
    }, 1400);
  };

  const commitNotes = async () => {
    const trimmed = localNotes.trim();
    if (trimmed === (idea.notes || '')) return;
    await onUpdateIdea(idea.id, { notes: trimmed });
    setSavedIndicator('notes');
    setTimeout(() => {
      setSavedIndicator((curr) => (curr === 'notes' ? null : curr));
    }, 1400);
  };

  const handleCopyTitle = async (slotIdx: number) => {
    const text = localTitles[slotIdx]?.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(slotIdx);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // ignore clipboard error
    }
  };

  const handleApplyUrlThumbnail = async (e: React.FormEvent) => {
    e.preventDefault();
    setThumbError(null);
    const extractedId = extractYouTubeId(urlDraft);
    if (!extractedId) {
      setThumbError('Introduce un link válido de YouTube.');
      return;
    }

    setIsThumbLoading(true);
    try {
      const info = await fetchYouTubeInfo(extractedId);
      const thumbs = getThumbnailUrls(extractedId);
      const nextTitles: [string, string, string, string] = [...localTitles] as [
        string,
        string,
        string,
        string,
      ];
      if (!nextTitles[0].trim() || idea.sourceType === 'url') {
        nextTitles[0] = info.title;
      }
      setLocalTitles(nextTitles);
      await onUpdateIdea(idea.id, {
        sourceType: 'url',
        videoId: extractedId,
        videoUrl: getCanonicalWatchUrl(extractedId),
        thumbnailUrl: thumbs.maxres,
        titles: nextTitles,
      });
      setIsEditingThumb(false);
    } catch {
      setThumbError('No se pudo obtener la información del video.');
    } finally {
      setIsThumbLoading(false);
    }
  };

  const handleUploadThumbnailFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setThumbError('Selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }
    setThumbError(null);
    setIsThumbLoading(true);
    try {
      const compressed = await compressThumbnailFile(file);
      await onUpdateIdea(idea.id, {
        sourceType: 'upload',
        thumbnailUrl: compressed,
      });
      setIsEditingThumb(false);
    } catch {
      setThumbError('Error al procesar la imagen.');
    } finally {
      setIsThumbLoading(false);
    }
  };

  const displayThumbUrl =
    imgFallbackStage === 1 && idea.videoId
      ? getThumbnailUrls(idea.videoId).hq
      : idea.thumbnailUrl;

  return (
    <article
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${
        isLight
          ? 'bg-white border-neutral-200/90 shadow-xs hover:border-neutral-300'
          : 'bg-[#151515] border-neutral-800/90 hover:border-neutral-700/80'
      }`}
    >
      {/* Top Bar: Idea Number + Actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-bold tabular-nums">
            Idea #{ideaNumber}
          </span>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 ${
              isLight
                ? 'bg-neutral-100 text-neutral-600'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
            }`}
          >
            {idea.sourceType === 'url' ? (
              <>
                <Link2 className="w-3 h-3 text-sky-400" />
                <span>URL de YouTube</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3 h-3 text-emerald-400" />
                <span>Imagen subida</span>
              </>
            )}
          </span>
          {idea.videoUrl && (
            <a
              href={idea.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-neutral-400 hover:text-red-400 inline-flex items-center gap-1 transition-colors"
              title="Abrir video de referencia en YouTube"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Ver referencia</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {confirmDelete ? (
            <div className="flex items-center gap-1 bg-red-950/50 border border-red-500/40 rounded-lg px-2 py-0.5">
              <span className="text-[11px] text-red-300 font-medium">¿Borrar?</span>
              <button
                type="button"
                onClick={() => void onDeleteIdea(idea.id)}
                className="text-[11px] font-bold text-red-400 hover:text-red-200 px-1 cursor-pointer"
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] text-neutral-400 hover:text-white px-1 cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? 'text-neutral-400 hover:text-red-600 hover:bg-neutral-100'
                  : 'text-neutral-500 hover:text-red-400 hover:bg-neutral-900'
              }`}
              title="Eliminar esta idea"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Sketch Layout:
          1. Left (Blue Rectangle): 16:9 Thumbnail (same size as before)
          2. Middle (4 Yellow Rectangles): Shorter 4 stacked title boxes (truncated if long)
          3. Right (Red Square): Side Note box matching the height of the row
      */}
      <div className="flex flex-col lg:flex-row items-stretch gap-3.5">
        {/* 1. Left Side: Thumbnail (same size: w-full lg:w-[360px] xl:w-[400px]) */}
        <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 flex flex-col">
          <div
            onClick={() => {
              if (!isEditingThumb) {
                setUrlDraft(idea.videoUrl || '');
                setThumbMode(idea.sourceType);
                setThumbError(null);
                setIsEditingThumb(true);
              }
            }}
            className={`relative aspect-video w-full rounded-xl overflow-hidden border group cursor-pointer select-none ${
              isLight
                ? 'bg-neutral-100 border-neutral-200'
                : 'bg-neutral-950 border-neutral-800'
            }`}
            title="Haz clic para cambiar la miniatura (URL o Imagen)"
          >
            {displayThumbUrl ? (
              <img
                src={displayThumbUrl}
                alt={localTitles[0] || `Idea #${ideaNumber}`}
                onError={() => {
                  if (imgFallbackStage === 0 && idea.videoId) {
                    setImgFallbackStage(1);
                  }
                }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-500">
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs">Haz clic para agregar miniatura</span>
              </div>
            )}

            {/* Hover overlay to edit thumbnail */}
            {!isEditingThumb && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3 text-center">
                <div className="px-3 py-1.5 rounded-xl bg-white/95 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                  <RefreshCw className="w-3.5 h-3.5 text-red-600" />
                  <span>Cambiar Miniatura / URL</span>
                </div>
                <span className="text-[11px] text-neutral-200">
                  Subir otra imagen o pegar otro link de YouTube
                </span>
              </div>
            )}

            {/* Inline Thumbnail Editor Overlay when clicked */}
            {isEditingThumb && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`absolute inset-0 z-10 p-3.5 flex flex-col justify-between backdrop-blur-md ${
                  isLight ? 'bg-white/95 text-neutral-900' : 'bg-neutral-950/95 text-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setThumbMode('url');
                        setThumbError(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                        thumbMode === 'url'
                          ? 'bg-red-600 text-white'
                          : isLight
                          ? 'bg-neutral-200 text-neutral-700'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <Link2 className="w-3 h-3" />
                      <span>URL YouTube</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setThumbMode('upload');
                        setThumbError(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                        thumbMode === 'upload'
                          ? 'bg-red-600 text-white'
                          : isLight
                          ? 'bg-neutral-200 text-neutral-700'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Subir Imagen</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingThumb(false)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {thumbMode === 'url' ? (
                  <form onSubmit={handleApplyUrlThumbnail} className="space-y-2 my-auto">
                    <p className="text-[11px] text-neutral-400">
                      Pega el link de YouTube (actualizará la miniatura y el Título 1):
                    </p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={urlDraft}
                        onChange={(e) => setUrlDraft(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className={`flex-1 border rounded-lg px-2.5 py-1.5 text-xs outline-none ${
                          isLight
                            ? 'bg-white border-neutral-300 text-neutral-900'
                            : 'bg-neutral-900 border-neutral-700 text-white'
                        }`}
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={isThumbLoading || !urlDraft.trim()}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer shrink-0"
                      >
                        {isThumbLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          'Aplicar'
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="my-auto flex flex-col items-center justify-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUploadThumbnailFile(file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={isThumbLoading}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      {isThumbLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>Seleccionar imagen de tu equipo</span>
                    </button>
                    <span className="text-[11px] text-neutral-400">
                      Se ajustará automáticamente a 16:9 HD
                    </span>
                  </div>
                )}

                {thumbError ? (
                  <p className="text-[11px] text-red-400 truncate">{thumbError}</p>
                ) : (
                  <div className="text-[10px] text-neutral-500 text-right">
                    Haz clic en X para cancelar
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Middle: 4 Shorter Editable Title Boxes (4 Yellow Rectangles in Sketch) */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5">
          {[0, 1, 2, 3].map((slotIdx) => {
            const val = localTitles[slotIdx] || '';
            const isSaved = savedIndicator === slotIdx;
            const isCopied = copiedIndex === slotIdx;

            return (
              <div
                key={slotIdx}
                className={`group/title relative flex items-center rounded-xl border transition-all flex-1 min-h-[44px] px-3 py-1.5 ${
                  val.trim()
                    ? isLight
                      ? 'bg-amber-50/60 border-amber-300/80 focus-within:border-amber-500 focus-within:bg-white'
                      : 'bg-amber-500/[0.06] border-amber-500/25 focus-within:border-amber-400/70 focus-within:bg-neutral-900'
                    : isLight
                    ? 'bg-neutral-50 border-neutral-200 focus-within:border-neutral-400 focus-within:bg-white'
                    : 'bg-neutral-900/60 border-neutral-800/90 focus-within:border-neutral-600 focus-within:bg-neutral-900'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 mr-2.5 select-none ${
                    val.trim()
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : isLight
                      ? 'bg-neutral-200 text-neutral-600'
                      : 'bg-neutral-800 text-neutral-500'
                  }`}
                >
                  {slotIdx + 1}
                </span>

                <input
                  type="text"
                  value={val}
                  title={val || undefined}
                  onChange={(e) => handleTitleChange(slotIdx, e.target.value)}
                  onBlur={() => void commitTitle(slotIdx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder={
                    slotIdx === 0 && idea.sourceType === 'url'
                      ? 'Título 1 (del URL)...'
                      : `Título #${slotIdx + 1}...`
                  }
                  className={`w-full bg-transparent text-xs sm:text-sm font-medium outline-none pr-10 truncate focus:text-clip ${
                    isLight
                      ? 'text-neutral-900 placeholder:text-neutral-400'
                      : 'text-neutral-100 placeholder:text-neutral-500'
                  }`}
                />

                <div className="absolute right-2 flex items-center gap-1">
                  {isSaved && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  {val.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => void handleCopyTitle(slotIdx)}
                      className={`p-1 rounded-md opacity-0 group-hover/title:opacity-100 transition-opacity cursor-pointer ${
                        isLight
                          ? 'hover:bg-neutral-200 text-neutral-600'
                          : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Copiar título"
                    >
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Right Side: Note Square Box (Red Square in Sketch) */}
        <div
          className={`w-full lg:w-[230px] xl:w-[260px] shrink-0 rounded-xl border p-3 flex flex-col justify-between transition-all ${
            localNotes.trim()
              ? isLight
                ? 'bg-red-50/50 border-red-200 focus-within:border-red-400 focus-within:bg-white'
                : 'bg-red-500/[0.06] border-red-500/25 focus-within:border-red-500/60 focus-within:bg-neutral-900'
              : isLight
              ? 'bg-neutral-50 border-neutral-200 focus-within:border-neutral-400 focus-within:bg-white'
              : 'bg-neutral-900/50 border-neutral-800/90 focus-within:border-neutral-600 focus-within:bg-neutral-900'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span
              className={`text-[11px] font-semibold flex items-center gap-1 ${
                localNotes.trim()
                  ? 'text-red-400'
                  : isLight
                  ? 'text-neutral-500'
                  : 'text-neutral-400'
              }`}
            >
              <StickyNote className="w-3 h-3" />
              <span>Nota</span>
            </span>
            {savedIndicator === 'notes' && (
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                <Check className="w-3 h-3" />
                <span>Guardado</span>
              </span>
            )}
          </div>

          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={() => void commitNotes()}
            placeholder="Escribir nota breve..."
            className={`w-full flex-1 min-h-[90px] lg:min-h-0 bg-transparent text-xs leading-relaxed outline-none resize-none ${
              isLight
                ? 'text-neutral-800 placeholder:text-neutral-400'
                : 'text-neutral-200 placeholder:text-neutral-500'
            }`}
          />
        </div>
      </div>
    </article>
  );
};
