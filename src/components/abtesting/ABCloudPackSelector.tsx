import React, { useEffect } from 'react';
import { FolderOpen, Check, AlertTriangle } from 'lucide-react';
import { UserVideoFolder, UserVideoPack } from '../../types';
import { ABDeviceType, ABPlacementMode, YOUTUBE_SPECS } from './types';

export interface ABCloudPackSelectorProps {
  theme: 'dark' | 'light';
  myVideos: UserVideoFolder[];
  myVideoPacks: UserVideoPack[];
  selectedVideoId: string | null;
  selectedPackId: string | null;
  device: ABDeviceType;
  placement: ABPlacementMode;
  onSelectVideo: (videoId: string) => void;
  onSelectPack: (packId: string) => void;
}

export const ABCloudPackSelector: React.FC<ABCloudPackSelectorProps> = ({
  theme,
  myVideos,
  myVideoPacks,
  selectedVideoId,
  selectedPackId,
  device,
  placement,
  onSelectVideo,
  onSelectPack,
}) => {
  const isLight = theme === 'light';
  const spec = YOUTUBE_SPECS[device][placement];

  // Auto-select first folder with packs (or first folder)
  useEffect(() => {
    if (myVideos.length === 0) return;
    const stillExists = myVideos.some((v) => v.id === selectedVideoId);
    if (!selectedVideoId || !stillExists) {
      const folderWithPacks = myVideos.find((v) =>
        myVideoPacks.some((p) => p.videoId === v.id)
      );
      onSelectVideo((folderWithPacks || myVideos[0]).id);
    }
  }, [myVideos, myVideoPacks, selectedVideoId, onSelectVideo]);

  // Auto-select first pack inside active folder when folder changes
  useEffect(() => {
    if (!selectedVideoId) return;
    const packsInFolder = myVideoPacks
      .filter((p) => p.videoId === selectedVideoId)
      .sort((a, b) => a.order - b.order);

    if (packsInFolder.length === 0) return;
    const currentInFolder = packsInFolder.some((p) => p.id === selectedPackId);
    if (!currentInFolder) {
      onSelectPack(packsInFolder[0].id);
    }
  }, [selectedVideoId, myVideoPacks, selectedPackId, onSelectPack]);

  if (myVideos.length === 0) {
    return (
      <div
        className={`rounded-xl border border-dashed p-6 text-center space-y-1.5 ${
          isLight
            ? 'border-neutral-200 bg-neutral-50 text-neutral-500'
            : 'border-neutral-800 bg-neutral-950/50 text-neutral-400'
        }`}
      >
        <FolderOpen className="w-6 h-6 text-red-500/70 mx-auto" />
        <p className="text-xs font-semibold">No tienes carpetas en "Mis Videos"</p>
        <p className="text-[11px] text-neutral-500">
          Crea una carpeta en la pestaña Mis Videos o usa el modo "Test Rápido".
        </p>
      </div>
    );
  }

  const activeFolder =
    myVideos.find((v) => v.id === selectedVideoId) || myVideos[0];
  const folderPacks = myVideoPacks
    .filter((p) => p.videoId === activeFolder.id)
    .sort((a, b) => a.order - b.order);
  const activePack =
    folderPacks.find((p) => p.id === selectedPackId) || folderPacks[0] || null;

  return (
    <div className="space-y-3.5">
      {/* Row 1: Minimalist Folder Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {myVideos.map((folder, idx) => {
          const isSelected = folder.id === activeFolder.id;
          const countInFolder = myVideoPacks.filter(
            (p) => p.videoId === folder.id
          ).length;

          return (
            <button
              key={folder.id}
              type="button"
              onClick={() => onSelectVideo(folder.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? isLight
                    ? 'bg-neutral-900 border-neutral-900 text-white font-semibold'
                    : 'bg-white border-white text-neutral-950 font-semibold'
                  : isLight
                  ? 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              <span className="opacity-60 text-[10px] font-bold">#{idx + 1}</span>
              <span className="max-w-[160px] truncate">{folder.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md tabular-nums ${
                  isSelected
                    ? isLight
                      ? 'bg-white/20 text-white'
                      : 'bg-black/15 text-neutral-900'
                    : 'bg-neutral-500/15 text-neutral-400'
                }`}
              >
                {countInFolder}
              </span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Pack Cards inside Folder + Character Cut Readout */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[11px] font-medium text-neutral-400">
            Elige qué pack visualizar en el simulador ({folderPacks.length} en esta carpeta):
          </span>

          {activePack && (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-neutral-500 tabular-nums">
                Longitud título: <strong>{activePack.title.length} caract.</strong>
              </span>
              {activePack.title.length > spec.maxVisibleChars ? (
                <span className="text-amber-400 flex items-center gap-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Se truncará con "..." en esta vista (máx ~{spec.maxVisibleChars})</span>
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Entra completo sin cortarse</span>
                </span>
              )}
            </div>
          )}
        </div>

        {folderPacks.length === 0 ? (
          <div
            className={`rounded-xl border border-dashed py-5 px-4 text-center text-xs text-neutral-500 ${
              isLight
                ? 'border-neutral-200 bg-neutral-50/60'
                : 'border-neutral-800 bg-neutral-950/40'
            }`}
          >
            Esta carpeta aún no tiene packs guardados. Súbelos en la pestaña "Mis Videos".
          </div>
        ) : (
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {folderPacks.map((pack) => {
              const isSelected = activePack?.id === pack.id;
              const letter = String.fromCharCode(65 + pack.order);

              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => onSelectPack(pack.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all shrink-0 w-72 cursor-pointer ${
                    isSelected
                      ? 'border-red-500 bg-red-600/10 ring-1 ring-red-500'
                      : isLight
                      ? 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                      : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                    <img
                      src={pack.thumbnailUrl}
                      alt={pack.title}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isSelected ? 'bg-red-600 text-white' : 'bg-black/80 text-white'
                      }`}
                    >
                      Pack {pack.order + 1} ({letter})
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium line-clamp-2 leading-snug"
                      title={pack.title}
                    >
                      {pack.title}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
