import React, { useEffect, useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Star, 
  Tag, 
  Edit3, 
  Calendar, 
  User, 
  Plus
} from 'lucide-react';
import { PackagingItem } from '../types';

interface LightboxModalProps {
  item: PackagingItem | null;
  items: PackagingItem[];
  allTags: string[];
  onClose: () => void;
  onSelect: (item: PackagingItem) => void;
  onToggleFavorite: (id: string) => void;
  onUpdateCategory: (id: string, category: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onUpdateTags: (id: string, newTags: string[]) => void;
  availableCategories: string[];
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  item,
  items,
  allTags,
  onClose,
  onSelect,
  onToggleFavorite,
  onUpdateCategory,
  onUpdateNotes,
  onUpdateTags,
  availableCategories,
}) => {
  const [copied, setCopied] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showTagSelector, setShowTagSelector] = useState(false);

  useEffect(() => {
    if (item) {
      setImgSrc(`https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`);
      setNoteText(item.notes || '');
      setIsEditingNote(false);
      setShowTagSelector(false);
    }
  }, [item]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!item) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        const currentIndex = items.findIndex((i) => i.id === item.id);
        if (currentIndex > 0) onSelect(items[currentIndex - 1]);
      } else if (e.key === 'ArrowRight') {
        const currentIndex = items.findIndex((i) => i.id === item.id);
        if (currentIndex < items.length - 1) onSelect(items[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, items, onClose, onSelect]);

  if (!item) return null;

  const currentIndex = items.findIndex((i) => i.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const handleImageError = () => {
    if (imgSrc.includes('maxresdefault')) {
      setImgSrc(`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`);
    } else if (imgSrc.includes('hqdefault')) {
      setImgSrc(`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(imgSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `packaging_${item.videoId}_full.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement('a');
      a.href = imgSrc;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    }
  };

  const handleSaveNote = () => {
    onUpdateNotes(item.id, noteText);
    setIsEditingNote(false);
  };

  const handleToggleTag = (tag: string) => {
    const currentTags = item.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    onUpdateTags(item.id, newTags);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-5xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300">
              {currentIndex + 1} de {items.length}
            </span>

            <div className="hidden sm:flex items-center gap-1.5">
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onUpdateCategory(item.id, cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    item.category === cat
                      ? cat === 'Ideas'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(item.id)}
              className={`p-2 rounded-xl transition-all ${
                item.favorite
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 hover:text-amber-400'
              }`}
              title="Favorito"
            >
              <Star className={`w-4 h-4 ${item.favorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Descargar miniatura en alta resolución"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar miniatura</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          <div className="relative flex-1 bg-black flex items-center justify-center min-h-[280px] lg:min-h-[480px] p-4">
            <img
              src={imgSrc}
              alt={item.title}
              onError={handleImageError}
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
            />

            {hasPrev && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(items[currentIndex - 1]);
                }}
                className="absolute left-4 p-2.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all hover:scale-110"
                title="Packaging anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {hasNext && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(items[currentIndex + 1]);
                }}
                className="absolute right-4 p-2.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-all hover:scale-110"
                title="Siguiente packaging"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="w-full lg:w-92 bg-neutral-900 p-5 border-t lg:border-t-0 lg:border-l border-neutral-800 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-semibold">
                  <User className="w-3.5 h-3.5 text-red-500" />
                  <span>{item.channelTitle || 'Canal de YouTube'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  item.category === 'Ideas'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {item.category}
                </span>
              </div>

              <h2 className="text-base font-bold text-white leading-snug">
                {item.title}
              </h2>

              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                    <Tag className="w-3.5 h-3.5 text-red-500" />
                    <span>Tags / Formatos del packaging:</span>
                  </div>
                  <button
                    onClick={() => setShowTagSelector(!showTagSelector)}
                    className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showTagSelector ? 'Cerrar' : 'Modificar tags'}</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {item.tags && item.tags.length > 0 ? (
                    item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 bg-neutral-800 text-neutral-200 border border-neutral-700/80 rounded-lg text-xs font-medium flex items-center gap-1.5"
                      >
                        <span>#{tag}</span>
                        <button
                          onClick={() => handleToggleTag(tag)}
                          className="text-neutral-400 hover:text-red-400"
                          title="Quitar tag"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-500 italic">
                      Sin tags asignados. Toca en "Modificar tags" para clasificarlo.
                    </span>
                  )}
                </div>

                {showTagSelector && (
                  <div className="pt-2 border-t border-neutral-800/80 space-y-1.5 animate-in fade-in duration-150">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                      Selecciona para añadir o quitar:
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                      {allTags.map((tag) => {
                        const isAssigned = item.tags?.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => handleToggleTag(tag)}
                            className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              isAssigned
                                ? 'bg-red-600 text-white font-semibold'
                                : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                            }`}
                          >
                            #{tag} {isAssigned && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-neutral-950/80 border border-neutral-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Notas del packaging:</span>
                  </div>
                  {!isEditingNote && (
                    <button
                      onClick={() => setIsEditingNote(true)}
                      className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                    >
                      <span>{item.notes ? 'Editar' : 'Agregar'}</span>
                    </button>
                  )}
                </div>

                {isEditingNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Escribe por qué te llamó la atención (colores, promesa, gancho, etc.)..."
                      rows={3}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 outline-none resize-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setNoteText(item.notes || '');
                          setIsEditingNote(false);
                        }}
                        className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveNote}
                        className="px-3 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg"
                      >
                        Guardar nota
                      </button>
                    </div>
                  </div>
                ) : item.notes ? (
                  <p className="text-xs text-neutral-300 leading-relaxed italic border-l-2 border-amber-500/50 pl-2">
                    "{item.notes}"
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 italic">
                    Sin notas agregadas. Hacé clic en "Agregar" para anotar qué te inspiró.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <Calendar className="w-3 h-3" />
                <span>Guardado el {new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-neutral-800">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir video en YouTube</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Link copiado al portapapeles</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar link de YouTube</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
