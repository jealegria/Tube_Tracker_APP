import React, { useState } from 'react';
import {
  FolderOpen,
  Trash2,
  Pencil,
  Check,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import { UserVideoFolder, UserVideoPack } from '../../types';

export interface VideoFolderCardProps {
  folder: UserVideoFolder;
  index: number;
  packs: UserVideoPack[];
  maxPacksPerVideo: number;
  theme: 'dark' | 'light';
  onOpenFolder: (folderId: string) => void;
  onRenameFolder: (folderId: string, newName: string) => Promise<void>;
  onDeleteFolder: (folderId: string) => Promise<void>;
}

export const VideoFolderCard: React.FC<VideoFolderCardProps> = ({
  folder,
  index,
  packs,
  maxPacksPerVideo,
  theme,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
}) => {
  const isLight = theme === 'light';
  const primaryPack = packs[0] || null;

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(folder.name);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (draftName.trim()) {
      await onRenameFolder(folder.id, draftName.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div
      onClick={() => {
        if (!isRenaming && !isDeleting) {
          onOpenFolder(folder.id);
        }
      }}
      className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-all cursor-pointer ${
        isLight
          ? 'bg-white border-neutral-200 hover:border-red-500/50 shadow-xs'
          : 'bg-neutral-900/60 border-neutral-800/90 hover:border-red-500/50'
      }`}
    >
      <div>
        <div className="relative aspect-video w-full bg-neutral-950 overflow-hidden">
          {primaryPack ? (
            <img
              src={primaryPack.thumbnailUrl}
              alt={primaryPack.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-500">
              <FolderOpen className="w-8 h-8 text-red-500/70" />
              <span className="text-xs font-medium">Carpeta vacía · Clic para subir packs</span>
            </div>
          )}

          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
            <span className="px-2 py-0.5 rounded-lg bg-black/80 text-white text-[11px] font-bold backdrop-blur-xs">
              Video #{index + 1}
            </span>
            <span
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold backdrop-blur-xs ${
                packs.length > 0
                  ? 'bg-red-600 text-white'
                  : 'bg-black/75 text-neutral-300'
              }`}
            >
              {packs.length} / {maxPacksPerVideo} Packs
            </span>
          </div>

          {packs.length > 1 && (
            <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 bg-black/75 p-1.5 rounded-xl backdrop-blur-xs">
              {packs.map((p) => (
                <div
                  key={p.id}
                  className="w-10 aspect-video rounded overflow-hidden border border-white/20 shrink-0"
                >
                  <img
                    src={p.thumbnailUrl}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 space-y-1.5">
          {isRenaming ? (
            <form
              onSubmit={handleRenameSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                autoFocus
                className={`flex-1 border rounded-lg px-2.5 py-1 text-xs font-semibold outline-none ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-300 text-neutral-900'
                    : 'bg-neutral-950 border-neutral-700 text-white'
                }`}
              />
              <button
                type="submit"
                className="p-1 rounded-lg bg-red-600 text-white hover:bg-red-500"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className="p-1 text-neutral-400 hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold leading-snug line-clamp-1" title={folder.name}>
                {folder.name}
              </h3>
            </div>
          )}

          <p className="text-xs text-neutral-500 line-clamp-1">
            {primaryPack
              ? `Pack 1: "${primaryPack.title}"`
              : 'Sin packs cargados todavía'}
          </p>
        </div>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className={`px-4 py-2.5 border-t flex items-center justify-between gap-2 ${
          isLight
            ? 'border-neutral-100 bg-neutral-50/70'
            : 'border-neutral-800/70 bg-neutral-950/40'
        }`}
      >
        <button
          type="button"
          onClick={() => onOpenFolder(folder.id)}
          className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Ver / Editar Packs ({packs.length}/{maxPacksPerVideo})</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDraftName(folder.name);
              setIsRenaming(true);
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors cursor-pointer"
            title="Renombrar carpeta"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {isDeleting ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  void onDeleteFolder(folder.id);
                  setIsDeleting(false);
                }}
                className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer"
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={() => setIsDeleting(false)}
                className="p-1 text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsDeleting(true)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Eliminar carpeta y sus packs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
