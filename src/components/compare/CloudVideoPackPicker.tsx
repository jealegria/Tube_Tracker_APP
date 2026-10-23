import React, { useEffect } from 'react';
import { FolderOpen, Check } from 'lucide-react';
import { UserVideoFolder, UserVideoPack } from '../../types';

export interface CloudVideoPackPickerProps {
  theme: 'dark' | 'light';
  myVideos: UserVideoFolder[];
  myVideoPacks: UserVideoPack[];
  selectedVideoId: string | null;
  selectedPackIds: string[];
  onSelectVideo: (videoId: string) => void;
  onTogglePack: (packId: string) => void;
  onSelectAllPacksInVideo: (packIds: string[]) => void;
  onClearCloudSelection: () => void;
}

export const CloudVideoPackPicker: React.FC<CloudVideoPackPickerProps> = ({
  theme,
  myVideos,
  myVideoPacks,
  selectedVideoId,
  selectedPackIds,
  onSelectVideo,
  onTogglePack,
  onSelectAllPacksInVideo,
  onClearCloudSelection,
}) => {
  const isLight = theme === 'light';

  // Auto-select the first video folder that has packs (or the first folder) to save clicks
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
        <p className="text-xs font-semibold">No tienes carpetas creadas en "Mis Videos"</p>
        <p className="text-[11px] text-neutral-500">
          Ve a la pestaña Mis Videos en el menú lateral para guardar tus carpetas y packs en la nube.
        </p>
      </div>
    );
  }

  const activeFolder =
    myVideos.find((v) => v.id === selectedVideoId) || myVideos[0];
  const folderPacks = myVideoPacks
    .filter((p) => p.videoId === activeFolder.id)
    .sort((a, b) => a.order - b.order);

  const allFolderPacksSelected =
    folderPacks.length > 0 &&
    folderPacks.every((p) => selectedPackIds.includes(p.id));

  return (
    <div className="space-y-3.5">
      {/* Minimalist Folder Strip (1-click folder selection) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span className="font-medium">Carpeta de video</span>
          {selectedPackIds.length > 0 && (
            <button
              type="button"
              onClick={onClearCloudSelection}
              className="text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              Limpiar selección ({selectedPackIds.length})
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {myVideos.map((folder, idx) => {
            const isSelected = folder.id === activeFolder.id;
            const countInFolder = myVideoPacks.filter(
              (p) => p.videoId === folder.id
            ).length;
            const selectedInFolder = myVideoPacks.filter(
              (p) => p.videoId === folder.id && selectedPackIds.includes(p.id)
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
                <span className="opacity-60 text-[10px] font-bold">
                  #{idx + 1}
                </span>
                <span className="max-w-[150px] truncate">{folder.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md tabular-nums ${
                    selectedInFolder > 0
                      ? 'bg-red-600 text-white font-bold'
                      : isSelected
                      ? isLight
                        ? 'bg-white/20 text-white'
                        : 'bg-black/15 text-neutral-900'
                      : 'bg-neutral-500/15 text-neutral-400'
                  }`}
                >
                  {selectedInFolder > 0
                    ? `${selectedInFolder}/${countInFolder}`
                    : countInFolder}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimalist Pack Selector Grid (1-click pack toggle) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-neutral-400">
            Selecciona qué packs comparar ({folderPacks.length} en esta carpeta)
          </span>
          {folderPacks.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (allFolderPacksSelected) {
                  // Unselect packs of this folder
                  folderPacks.forEach((p) => {
                    if (selectedPackIds.includes(p.id)) onTogglePack(p.id);
                  });
                } else {
                  onSelectAllPacksInVideo(folderPacks.map((p) => p.id));
                }
              }}
              className="text-red-500 hover:text-red-400 font-semibold transition-colors cursor-pointer"
            >
              {allFolderPacksSelected ? 'Desmarcar carpeta' : 'Seleccionar todos'}
            </button>
          )}
        </div>

        {folderPacks.length === 0 ? (
          <div
            className={`rounded-xl border border-dashed py-6 px-4 text-center text-xs text-neutral-500 ${
              isLight ? 'border-neutral-200 bg-neutral-50/60' : 'border-neutral-800 bg-neutral-950/40'
            }`}
          >
            Esta carpeta aún no tiene packs guardados. Súbelos en la pestaña "Mis Videos".
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {folderPacks.map((pack) => {
              const isSelected = selectedPackIds.includes(pack.id);
              const letter = String.fromCharCode(65 + pack.order);

              return (
                <button
                  key={pack.id}
                  type="button"
                  onClick={() => onTogglePack(pack.id)}
                  className={`group flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
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
                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        isSelected
                          ? 'bg-red-600 text-white'
                          : 'bg-black/80 text-white'
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

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-red-600 text-white'
                        : isLight
                        ? 'border border-neutral-300 bg-white'
                        : 'border border-neutral-700 bg-neutral-900'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
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
