import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Maximize2,
  Star,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Download,
  Tag,
} from 'lucide-react';
import { PackagingItem } from '../types';

interface PackagingCardProps {
  item: PackagingItem;
  theme: 'dark' | 'light';
  availableCategories: string[];
  allTags: string[];
  detailedView: boolean;
  showTitles: boolean;
  onUpdateCategory: (id: string, newCategory: string) => void;
  onUpdateTags: (id: string, newTags: string[]) => void;
  onUpdateNotes: (id: string, newNotes: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenLightbox: (item: PackagingItem) => void;
}

export const PackagingCard: React.FC<PackagingCardProps> = ({
  item,
  theme,
  availableCategories,
  allTags,
  detailedView,
  showTitles,
  onUpdateCategory,
  onUpdateTags,
  onUpdateNotes,
  onToggleFavorite,
  onDelete,
  onOpenLightbox,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(
    `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`
  );
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTagSubmenu, setShowTagSubmenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(item.notes || '');
  const menuRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  const handleImageError = () => {
    if (imgSrc.includes('maxresdefault')) {
      setImgSrc(`https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`);
    } else if (imgSrc.includes('hqdefault')) {
      setImgSrc(`https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowTagSubmenu(false);
        setConfirmDelete(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleCopyUrl = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(item.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setShowMenu(false);
    } catch {
      // Ignore clipboard error
    }
  };

  const handleDownloadThumbnail = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowMenu(false);
    try {
      const response = await fetch(imgSrc);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `packaging_${item.videoId}_thumb.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement('a');
      link.href = imgSrc;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    }
  };

  const handleSaveNotes = () => {
    onUpdateNotes(item.id, noteText);
    setIsEditingNotes(false);
  };

  const handleToggleTag = (tag: string) => {
    const currentTags = item.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    onUpdateTags(item.id, newTags);
  };

  const channelInitial = item.channelTitle ? item.channelTitle.trim().charAt(0).toUpperCase() : 'Y';

  const renderDropdownMenu = () => (
    <div
      className={`absolute right-0 top-full mt-1.5 w-56 border rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
        isLight
          ? 'bg-white border-neutral-200 text-neutral-800'
          : 'bg-[#18181b] border-neutral-700 text-neutral-200 ring-1 ring-white/10'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          setShowMenu(false);
          onOpenLightbox(item);
        }}
        className={`w-full px-3 py-2 text-xs flex items-center gap-2.5 transition-colors ${
          isLight ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'
        }`}
      >
        <Maximize2 className="w-4 h-4 text-neutral-400" />
        <span>Ver detalles y expandir</span>
      </button>

      <button
        onClick={() => {
          onToggleFavorite(item.id);
          setShowMenu(false);
        }}
        className={`w-full px-3 py-2 text-xs flex items-center gap-2.5 transition-colors ${
          isLight ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'
        }`}
      >
        <Star
          className={`w-4 h-4 ${
            item.favorite ? 'fill-amber-400 text-amber-400' : 'text-neutral-400'
          }`}
        />
        <span>{item.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}</span>
      </button>

      <button
        onClick={() => setShowTagSubmenu(!showTagSubmenu)}
        className={`w-full px-3 py-2 text-xs flex items-center justify-between transition-colors ${
          isLight ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Tag className="w-4 h-4 text-neutral-400" />
          <span>Asignar tags ({item.tags?.length || 0})</span>
        </div>
        <span className="text-[10px] text-neutral-500">{showTagSubmenu ? '▲' : '▼'}</span>
      </button>

      {showTagSubmenu && (
        <div
          className={`px-3 py-2 border-y max-h-40 overflow-y-auto space-y-1 ${
            isLight
              ? 'bg-neutral-50 border-neutral-200'
              : 'bg-neutral-950/80 border-neutral-800'
          }`}
        >
          {allTags.length === 0 ? (
            <span className="text-[11px] text-neutral-500">No hay tags creados</span>
          ) : (
            allTags.map((tag) => {
              const isAssigned = item.tags?.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleToggleTag(tag)}
                  className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${
                    isAssigned
                      ? 'bg-red-500/20 text-red-500 font-medium'
                      : isLight
                      ? 'text-neutral-600 hover:bg-neutral-200/70'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                  }`}
                >
                  <span>#{tag}</span>
                  {isAssigned && <Check className="w-3.5 h-3.5 text-red-500" />}
                </button>
              );
            })
          )}
        </div>
      )}

      <button
        onClick={handleCopyUrl}
        className={`w-full px-3 py-2 text-xs flex items-center gap-2.5 transition-colors ${
          isLight ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500">¡Enlace copiado!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 text-neutral-400" />
            <span>Copiar link de YouTube</span>
          </>
        )}
      </button>

      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setShowMenu(false)}
        className={`w-full px-3 py-2 text-xs flex items-center gap-2.5 transition-colors ${
          isLight ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'
        }`}
      >
        <ExternalLink className="w-4 h-4 text-neutral-400" />
        <span>Abrir en YouTube</span>
      </a>

      <button
        onClick={handleDownloadThumbnail}
        className={`w-full px-3 py-2 text-xs flex items-center gap-2.5 transition-colors ${
          isLight ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'
        }`}
      >
        <Download className="w-4 h-4 text-neutral-400" />
        <span>Descargar miniatura</span>
      </button>

      <div
        className={`my-1 border-t pt-1 ${
          isLight ? 'border-neutral-200' : 'border-neutral-800'
        }`}
      >
        <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-neutral-500">
          Cambiar categoría
        </div>
        {availableCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              onUpdateCategory(item.id, cat);
              setShowMenu(false);
            }}
            className={`w-full px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
              isLight ? 'hover:bg-neutral-100' : 'hover:bg-neutral-800'
            } ${
              item.category === cat
                ? isLight
                  ? 'text-neutral-900 font-semibold bg-neutral-100'
                  : 'text-white font-medium bg-neutral-800/50'
                : 'text-neutral-400'
            }`}
          >
            <span>{cat}</span>
            {item.category === cat && <Check className="w-3.5 h-3.5 text-red-500" />}
          </button>
        ))}
      </div>

      <div
        className={`border-t pt-1 mt-1 ${
          isLight ? 'border-neutral-200' : 'border-neutral-800'
        }`}
      >
        {confirmDelete ? (
          <div className="p-2 bg-red-950/70 border border-red-500/40 rounded-lg mx-1 my-1 space-y-1.5 animate-in fade-in duration-150">
            <div className="text-[11px] font-semibold text-red-200">
              ¿Eliminar este packaging?
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setConfirmDelete(false);
                  onDelete(item.id);
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold transition-colors"
              >
                Sí, eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-neutral-300 hover:text-white text-[11px] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Eliminar packaging</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={menuRef}
      className={`group relative flex flex-col transition-all duration-200 ${
        showMenu ? 'z-40' : 'z-10'
      }`}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-video w-full bg-neutral-900 cursor-pointer rounded-xl overflow-hidden shadow-sm"
        onClick={() => onOpenLightbox(item)}
      >
        <img
          src={imgSrc}
          alt={item.title}
          onError={handleImageError}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {item.favorite && (
          <div className="absolute top-2.5 left-2.5 pointer-events-none">
            <span className="p-1 rounded-full bg-amber-500/90 text-neutral-950 shadow-md flex items-center justify-center">
              <Star className="w-3 h-3 fill-neutral-950" />
            </span>
          </div>
        )}

        {/* Top-Right Hover Controls (Expand + 3-dots menu when titles are hidden) */}
        <div
          className={`absolute top-2.5 right-2.5 flex items-center gap-1.5 transition-opacity pointer-events-auto ${
            showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenLightbox(item);
            }}
            className="p-1.5 rounded-lg bg-black/80 hover:bg-black text-white/90 hover:text-white backdrop-blur-md border border-white/10 shadow-lg transition-transform hover:scale-105"
            title="Expandir miniatura"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {!showTitles && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
                setShowTagSubmenu(false);
                setConfirmDelete(false);
              }}
              className="p-1.5 rounded-lg bg-black/80 hover:bg-black text-white/90 hover:text-white backdrop-blur-md border border-white/10 shadow-lg transition-transform hover:scale-105"
              title="Opciones"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Dropdown when titles are hidden */}
      {!showTitles && showMenu && renderDropdownMenu()}

      {/* Title & Channel Row (only when showTitles is true) */}
      {showTitles && (
        <div className="pt-3 flex items-start gap-3">
          <div
            onClick={() => onOpenLightbox(item)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 uppercase select-none cursor-pointer hover:opacity-90 transition-opacity ${
              isLight
                ? 'bg-neutral-200 border-neutral-300 text-neutral-800'
                : 'bg-neutral-800 border-white/10 text-neutral-200'
            }`}
            title={item.channelTitle || 'Canal'}
          >
            {channelInitial}
          </div>

          <div className="flex-1 min-w-0 pr-0.5">
            <h3
              onClick={() => onOpenLightbox(item)}
              className={`text-[14px] leading-[20px] font-medium transition-colors line-clamp-2 cursor-pointer break-words ${
                isLight
                  ? 'text-neutral-900 group-hover:text-black'
                  : 'text-[#f1f1f1] group-hover:text-white'
              }`}
              title={item.title}
            >
              {item.title}
            </h3>

            <div
              onClick={() => onOpenLightbox(item)}
              className={`text-[12px] mt-1 leading-tight flex items-center gap-1 transition-colors cursor-pointer truncate ${
                isLight
                  ? 'text-neutral-500 hover:text-neutral-800'
                  : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
              }`}
            >
              <span>{item.channelTitle || 'Canal de YouTube'}</span>
            </div>
          </div>

          <div className="relative shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
                setShowTagSubmenu(false);
                setConfirmDelete(false);
              }}
              className={`p-1 rounded-full transition-all ${
                isLight
                  ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              } ${
                showMenu
                  ? isLight
                    ? 'opacity-100 bg-neutral-200 text-neutral-900'
                    : 'opacity-100 bg-neutral-800 text-white'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Opciones"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && renderDropdownMenu()}
          </div>
        </div>
      )}

      {/* Detailed View (Tags, Category, Notes) */}
      {detailedView && (
        <div
          className={`mt-2 pt-2 border-t space-y-2 animate-in fade-in duration-200 text-xs ${
            isLight ? 'border-neutral-200' : 'border-neutral-800/80'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <span className="font-semibold text-red-500">{item.category}</span>
            {item.tags && item.tags.length > 0 && (
              <>
                <span>·</span>
                <span className="truncate">
                  {item.tags.map((t) => `#${t}`).join('  ')}
                </span>
              </>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-1.5">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Nota..."
                rows={2}
                className={`w-full border rounded-lg p-2 text-xs outline-none resize-none ${
                  isLight
                    ? 'bg-white border-neutral-300 text-neutral-900'
                    : 'bg-neutral-950 border-neutral-700 text-neutral-200'
                }`}
                autoFocus
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="px-2 py-0.5 text-[10px] text-neutral-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNotes}
                  className={`px-2 py-0.5 text-[10px] rounded font-semibold ${
                    isLight
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-200 text-neutral-900'
                  }`}
                >
                  Guardar
                </button>
              </div>
            </div>
          ) : item.notes ? (
            <div
              onClick={() => setIsEditingNotes(true)}
              className={`p-2 border rounded-lg cursor-pointer ${
                isLight
                  ? 'bg-neutral-100 border-neutral-200 text-neutral-700'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <p className="text-[11px] italic line-clamp-2">"{item.notes}"</p>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-left text-[11px] text-neutral-500 hover:text-neutral-400 flex items-center gap-1"
            >
              <Tag className="w-2.5 h-2.5" />
              <span>+ Agregar nota</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
