import React, { useState } from 'react';
import { FolderPlus, Plus } from 'lucide-react';
import { UserVideoFolder, UserVideoPack } from '../types';
import { ProfileId } from '../firebase';
import { VideoFolderCard } from './misvideos/VideoFolderCard';
import { VideoFolderDetailView } from './misvideos/VideoFolderDetailView';

interface MyVideosModuleProps {
  theme: 'dark' | 'light';
  activeProfile: ProfileId;
  defaultChannelName: string;
  myVideos: UserVideoFolder[];
  myVideoPacks: UserVideoPack[];
  onCreateVideoFolder: (name: string) => Promise<UserVideoFolder | null>;
  onRenameVideoFolder: (videoId: string, newName: string) => Promise<void>;
  onDeleteVideoFolder: (videoId: string) => Promise<void>;
  onUpsertVideoPack: (
    videoId: string,
    orderIndex: number,
    title: string,
    thumbnailUrl: string,
    existingPackId?: string
  ) => Promise<void>;
  onDeleteVideoPack: (packId: string) => Promise<void>;
}

const MAX_VIDEOS = 10;
const MAX_PACKS_PER_VIDEO = 5;

export const MyVideosModule: React.FC<MyVideosModuleProps> = ({
  theme,
  defaultChannelName,
  myVideos,
  myVideoPacks,
  onCreateVideoFolder,
  onRenameVideoFolder,
  onDeleteVideoFolder,
  onUpsertVideoPack,
  onDeleteVideoPack,
}) => {
  const isLight = theme === 'light';

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const selectedFolder = myVideos.find((v) => v.id === selectedVideoId) || null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (myVideos.length >= MAX_VIDEOS || isCreatingFolder) return;

    const folderName = newFolderName.trim() || `Video #${myVideos.length + 1}`;
    setIsCreatingFolder(true);
    try {
      const created = await onCreateVideoFolder(folderName);
      setNewFolderName('');
      if (created) {
        setSelectedVideoId(created.id);
      }
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleQuickCreateSlot = async (slotNum: number) => {
    if (myVideos.length >= MAX_VIDEOS || isCreatingFolder) return;
    setIsCreatingFolder(true);
    try {
      const created = await onCreateVideoFolder(`Video #${slotNum}`);
      if (created) {
        setSelectedVideoId(created.id);
      }
    } finally {
      setIsCreatingFolder(false);
    }
  };

  if (selectedFolder) {
    const folderIndex = myVideos.findIndex((v) => v.id === selectedFolder.id) + 1;
    const folderPacks = myVideoPacks.filter((p) => p.videoId === selectedFolder.id);

    return (
      <VideoFolderDetailView
        folder={selectedFolder}
        folderIndex={folderIndex}
        folderPacks={folderPacks}
        maxPacksPerVideo={MAX_PACKS_PER_VIDEO}
        theme={theme}
        defaultChannelName={defaultChannelName}
        onBack={() => setSelectedVideoId(null)}
        onRenameFolder={onRenameVideoFolder}
        onUpsertPack={onUpsertVideoPack}
        onDeletePack={onDeleteVideoPack}
      />
    );
  }

  const canCreateMore = myVideos.length < MAX_VIDEOS;

  return (
    <div className="space-y-6 pb-12">
      <div
        className={`rounded-2xl border p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900/50 border-neutral-800/80'
        }`}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold">
              Mis Videos
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-bold tabular-nums">
              {myVideos.length} / {MAX_VIDEOS} Videos
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Almacena hasta {MAX_VIDEOS} videos. Dentro de cada carpeta puedes guardar y editar hasta {MAX_PACKS_PER_VIDEO} packs (miniatura + título).
          </p>
        </div>

        {canCreateMore ? (
          <form onSubmit={handleCreateSubmit} className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder={`Nombre o idea del Video #${myVideos.length + 1}...`}
              className={`w-full sm:w-72 border rounded-xl px-3.5 py-2.5 text-xs outline-none ${
                isLight
                  ? 'bg-neutral-50 border-neutral-300 focus:border-red-500 text-neutral-900'
                  : 'bg-neutral-950 border-neutral-800 focus:border-red-500 text-white'
              }`}
            />
            <button
              type="submit"
              disabled={isCreatingFolder}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Crear Carpeta ({myVideos.length + 1}/{MAX_VIDEOS})</span>
            </button>
          </form>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
            Límite de {MAX_VIDEOS}/{MAX_VIDEOS} videos alcanzado. Elimina un video terminado para crear otro.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {myVideos.map((folder, idx) => {
          const packs = myVideoPacks
            .filter((p) => p.videoId === folder.id)
            .sort((a, b) => a.order - b.order);

          return (
            <VideoFolderCard
              key={folder.id}
              folder={folder}
              index={idx}
              packs={packs}
              maxPacksPerVideo={MAX_PACKS_PER_VIDEO}
              theme={theme}
              onOpenFolder={setSelectedVideoId}
              onRenameFolder={onRenameVideoFolder}
              onDeleteFolder={onDeleteVideoFolder}
            />
          );
        })}

        {canCreateMore && (
          <button
            type="button"
            disabled={isCreatingFolder}
            onClick={() => void handleQuickCreateSlot(myVideos.length + 1)}
            className={`rounded-2xl border border-dashed p-6 flex flex-col items-center justify-center gap-3 text-center transition-colors min-h-[240px] cursor-pointer ${
              isLight
                ? 'border-neutral-300 bg-white/50 hover:bg-white hover:border-red-500/50 text-neutral-600'
                : 'border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/50 hover:border-red-500/50 text-neutral-400'
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold">
                + Nuevo Video (Espacio #{myVideos.length + 1} de {MAX_VIDEOS})
              </p>
              <p className="text-[11px] text-neutral-500 max-w-[220px]">
                Crea una carpeta para guardar hasta {MAX_PACKS_PER_VIDEO} miniaturas y títulos en la nube
              </p>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};
