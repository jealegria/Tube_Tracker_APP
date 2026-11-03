import React, { useState } from 'react';
import { ArrowLeft, Pencil, Check, X, ArrowLeftRight } from 'lucide-react';
import { UserVideoFolder, UserVideoPack } from '../../types';
import { PackSlotCard } from './PackSlotCard';

export interface VideoFolderDetailViewProps {
  folder: UserVideoFolder;
  folderIndex: number;
  folderPacks: UserVideoPack[];
  maxPacksPerVideo: number;
  theme: 'dark' | 'light';
  defaultChannelName: string;
  onBack: () => void;
  onRenameFolder: (videoId: string, newName: string) => Promise<void>;
  onUpsertPack: (
    videoId: string,
    orderIndex: number,
    title: string,
    thumbnailUrl: string,
    existingPackId?: string
  ) => Promise<void>;
  onDeletePack: (packId: string) => Promise<void>;
  onMovePackSlot: (
    videoId: string,
    fromSlotIndex: number,
    toSlotIndex: number
  ) => Promise<void>;
  onCompactPacks: (videoId: string) => Promise<void>;
}

export const VideoFolderDetailView: React.FC<VideoFolderDetailViewProps> = ({
  folder,
  folderIndex,
  folderPacks,
  maxPacksPerVideo,
  theme,
  defaultChannelName,
  onBack,
  onRenameFolder,
  onUpsertPack,
  onDeletePack,
  onMovePackSlot,
  onCompactPacks,
}) => {
  const isLight = theme === 'light';
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(folder.name);
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftName.trim()) {
      await onRenameFolder(folder.id, draftName.trim());
    }
    setIsRenaming(false);
  };

  // Detect if there are empty gaps before existing packs (e.g., pack at slot 2 while slot 0 or 1 is empty)
  const hasEmptyGapsBeforePacks = folderPacks.some(
    (p, idx) => p.order !== idx
  );

  return (
    <div className="space-y-6 pb-12">
      <div
        className={`rounded-2xl border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 ${
          isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900/60 border-neutral-800/90'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'bg-neutral-50 border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Mis Videos</span>
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-500 text-[10px] font-bold uppercase tracking-wider shrink-0">
                Carpeta #{folderIndex}
              </span>
              <span className="text-[11px] text-neutral-500 hidden sm:inline">
                · Puedes arrastrar los packs o usar las flechas para cambiar su orden
              </span>
            </div>

            {isRenaming ? (
              <form
                onSubmit={handleRenameSubmit}
                className="flex items-center gap-2 mt-1.5"
              >
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  autoFocus
                  className={`border rounded-xl px-3 py-1.5 text-sm font-bold outline-none w-full max-w-md ${
                    isLight
                      ? 'bg-neutral-50 border-neutral-300 focus:border-red-500 text-neutral-900'
                      : 'bg-neutral-950 border-neutral-700 focus:border-red-500 text-white'
                  }`}
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 cursor-pointer"
                  title="Guardar nombre"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <h1 className="text-base sm:text-lg font-bold truncate">
                  {folder.name}
                </h1>
                <button
                  type="button"
                  onClick={() => {
                    setDraftName(folder.name);
                    setIsRenaming(true);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isLight
                      ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                  title="Cambiar nombre del video"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {hasEmptyGapsBeforePacks && (
            <button
              type="button"
              onClick={() => void onCompactPacks(folder.id)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Correr todos los packs hacia adelante para dejar los espacios vacíos al final"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Dejar vacíos al final</span>
            </button>
          )}

          <div
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold ${
              isLight
                ? 'bg-neutral-50 border-neutral-200 text-neutral-800'
                : 'bg-neutral-950 border-neutral-800 text-neutral-200'
            }`}
          >
            Packs guardados:{' '}
            <span className="text-red-500">
              {folderPacks.length} / {maxPacksPerVideo}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: maxPacksPerVideo }).map((_, idx) => {
          const packForSlot = folderPacks.find((p) => p.order === idx);
          const isDropTarget =
            dragOverSlotIndex === idx &&
            draggedSlotIndex !== null &&
            draggedSlotIndex !== idx;

          return (
            <div
              key={`${folder.id}-slot-${idx}-${packForSlot?.id || 'empty'}`}
              onDragOver={(e) => {
                if (draggedSlotIndex !== null) {
                  e.preventDefault();
                  if (dragOverSlotIndex !== idx) {
                    setDragOverSlotIndex(idx);
                  }
                }
              }}
              onDragLeave={() => {
                if (dragOverSlotIndex === idx) {
                  setDragOverSlotIndex(null);
                }
              }}
              onDrop={(e) => {
                if (draggedSlotIndex !== null) {
                  e.preventDefault();
                  const fromIdx = draggedSlotIndex;
                  setDraggedSlotIndex(null);
                  setDragOverSlotIndex(null);
                  if (fromIdx !== idx) {
                    void onMovePackSlot(folder.id, fromIdx, idx);
                  }
                }
              }}
              className={`rounded-2xl transition-all ${
                isDropTarget
                  ? 'ring-2 ring-red-500 scale-[1.01]'
                  : draggedSlotIndex === idx
                  ? 'opacity-50'
                  : ''
              }`}
            >
              <PackSlotCard
                slotIndex={idx}
                maxSlots={maxPacksPerVideo}
                videoId={folder.id}
                existingPack={packForSlot}
                theme={theme}
                channelName={defaultChannelName}
                onSavePack={onUpsertPack}
                onDeletePack={onDeletePack}
                onMoveToSlot={(targetSlot) =>
                  onMovePackSlot(folder.id, idx, targetSlot)
                }
                onDragStartSlot={() => setDraggedSlotIndex(idx)}
                onDragEndSlot={() => {
                  setDraggedSlotIndex(null);
                  setDragOverSlotIndex(null);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

