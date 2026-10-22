import React, { useState } from 'react';
import {
  Link2,
  ClipboardPaste,
  Plus,
  Loader2,
  AlertCircle,
  Sparkles,
  Layers,
  FolderPlus,
  Tag,
  SlidersHorizontal,
  X,
  RotateCcw,
} from 'lucide-react';
import { PackagingItem } from '../types';
import { ProfileId, PROFILES } from '../firebase';
import { extractYouTubeId, fetchYouTubeInfo, getCanonicalWatchUrl } from '../utils/youtube';

interface PackagingCaptureFormProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  activeProfile: ProfileId;
  categories: string[];
  tags: string[];
  packagings: PackagingItem[];
  onAddPackaging: (item: PackagingItem) => Promise<void>;
  onAddTag: (tagName: string) => void;
  onOpenTagManager: () => void;
}

export const PackagingCaptureForm: React.FC<PackagingCaptureFormProps> = ({
  isOpen,
  onClose,
  theme,
  activeProfile,
  categories,
  tags,
  packagings,
  onAddPackaging,
  onAddTag,
  onOpenTagManager,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0] || 'Ideas');
  const [selectedNewTags, setSelectedNewTags] = useState<string[]>([]);
  const [notesInput, setNotesInput] = useState('');
  const [showQuickTagCreate, setShowQuickTagCreate] = useState(false);
  const [quickTagInput, setQuickTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const toggleTagForNewItem = (tag: string) => {
    setSelectedNewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleQuickAddTagInForm = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickTagInput.trim();
    if (!trimmed) return;

    onAddTag(trimmed);
    if (!selectedNewTags.includes(trimmed)) {
      setSelectedNewTags((prev) => [...prev, trimmed]);
    }
    setQuickTagInput('');
    setShowQuickTagCreate(false);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
        setErrorMsg(null);
      }
    } catch {
      setErrorMsg('No se pudo leer el portapapeles automáticamente. Pega el link con Ctrl+V.');
    }
  };

  const handleClearFields = () => {
    setUrlInput('');
    setNotesInput('');
    setSelectedNewTags([]);
    setErrorMsg(null);
  };

  const handleAddPackagingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const videoId = extractYouTubeId(urlInput);
    if (!videoId) {
      setErrorMsg('Introduce un link válido de YouTube (watch, youtu.be, shorts, etc.).');
      return;
    }

    if (packagings.some((p) => p.videoId === videoId)) {
      setErrorMsg(`Este video ya está guardado en el perfil de ${PROFILES[activeProfile].name}.`);
      return;
    }

    setIsLoading(true);
    try {
      const info = await fetchYouTubeInfo(videoId);
      const newItem: PackagingItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        videoId,
        url: getCanonicalWatchUrl(videoId),
        title: info.title,
        channelTitle: info.channelTitle,
        category: selectedCategory || categories[0] || 'Ideas',
        tags: selectedNewTags,
        notes: notesInput.trim() || undefined,
        createdAt: Date.now(),
        favorite: false,
      };

      await onAddPackaging(newItem);
      handleClearFields();
      onClose();
    } catch {
      setErrorMsg('Ocurrió un error al obtener los datos del video.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl rounded-2xl border p-5 sm:p-6 shadow-2xl space-y-5 ${
          isLight
            ? 'bg-white border-neutral-200 text-neutral-900'
            : 'bg-[#141414] border-neutral-800 text-neutral-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">
              Agregar Pack a {PROFILES[activeProfile].name}
            </h2>
            <p className="text-xs text-neutral-500">
              Pega el enlace de YouTube y asigna categoría, tags o notas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isLight
                ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAddPackagingSubmit} className="space-y-4">
          {/* URL Field + Paste + Clear */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">
              Enlace de YouTube
            </label>
            <div className="relative flex items-center">
              <Link2 className="w-4 h-4 text-neutral-500 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className={`w-full border rounded-xl pl-10 pr-40 py-2.5 text-sm outline-none transition-all ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-300 focus:border-red-500 text-neutral-900 placeholder:text-neutral-400'
                    : 'bg-neutral-950 border-neutral-800 focus:border-red-500/70 text-white placeholder:text-neutral-500'
                }`}
                autoFocus
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleClearFields}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    isLight
                      ? 'bg-neutral-200/80 hover:bg-neutral-300 text-neutral-700'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                  }`}
                  title="Limpiar campos"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                    isLight
                      ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                  title="Pegar del portapapeles"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Pegar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">
              Categoría
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-sm'
                        : isLight
                        ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                    }`}
                  >
                    {cat === 'Ideas' ? (
                      <Sparkles className="w-3.5 h-3.5" />
                    ) : cat === 'Formatos' ? (
                      <Layers className="w-3.5 h-3.5" />
                    ) : (
                      <FolderPlus className="w-3.5 h-3.5" />
                    )}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-neutral-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-red-500" />
                <span>Tags</span>
              </label>
              <button
                type="button"
                onClick={onOpenTagManager}
                className="text-xs text-neutral-400 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Gestionar tags</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => {
                const isSelected = selectedNewTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTagForNewItem(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-red-600 text-white shadow-sm'
                        : isLight
                        ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}

              {showQuickTagCreate ? (
                <div
                  className={`flex items-center gap-1 border rounded-lg px-2 py-0.5 ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-300'
                      : 'bg-neutral-950 border-neutral-700'
                  }`}
                >
                  <input
                    type="text"
                    value={quickTagInput}
                    onChange={(e) => setQuickTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleQuickAddTagInForm(e);
                      } else if (e.key === 'Escape') {
                        setShowQuickTagCreate(false);
                      }
                    }}
                    placeholder="Nuevo tag..."
                    className="bg-transparent text-xs outline-none w-24 py-0.5"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddTagInForm}
                    className="text-xs font-bold text-emerald-500 hover:text-emerald-400 px-1"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickTagCreate(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-300"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowQuickTagCreate(true)}
                  className={`px-2 py-1 rounded-lg text-xs border border-dashed flex items-center gap-1 transition-colors ${
                    isLight
                      ? 'text-neutral-600 hover:text-neutral-900 border-neutral-300 hover:bg-neutral-100'
                      : 'text-neutral-400 hover:text-white border-neutral-700 hover:bg-neutral-800'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span>Crear tag</span>
                </button>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-400">
              Nota (opcional)
            </label>
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="Ej: Buen contraste de colores, cara de shock, promesa clara..."
              className={`w-full border rounded-xl px-3.5 py-2 text-xs outline-none ${
                isLight
                  ? 'bg-neutral-50 border-neutral-300 focus:border-neutral-500 text-neutral-900 placeholder:text-neutral-400'
                  : 'bg-neutral-950 border-neutral-800 focus:border-neutral-700 text-neutral-200 placeholder:text-neutral-500'
              }`}
            />
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                isLight
                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Guardar Pack</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
