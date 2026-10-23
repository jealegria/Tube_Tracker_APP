import React from 'react';
import { FolderKanban, Zap } from 'lucide-react';
import { UserVideoFolder, UserVideoPack } from '../../types';
import { UserDraftPack } from './types';
import { CloudVideoPackPicker } from './CloudVideoPackPicker';
import { QuickRamPackUploader } from './QuickRamPackUploader';

export type PackSourceMode = 'cloud' | 'ram';

interface UserPacksUploaderProps {
  theme: 'dark' | 'light';
  channelName: string;
  sourceMode: PackSourceMode;
  onChangeSourceMode: (mode: PackSourceMode) => void;
  myVideos: UserVideoFolder[];
  myVideoPacks: UserVideoPack[];
  selectedCloudVideoId: string | null;
  selectedCloudPackIds: string[];
  onSelectCloudVideo: (videoId: string) => void;
  onToggleCloudPack: (packId: string) => void;
  onSelectAllCloudPacksInVideo: (packIds: string[]) => void;
  onClearCloudSelection: () => void;
  ramPacks: UserDraftPack[];
  onAddRamPack: (pack: UserDraftPack) => void;
  onRemoveRamPack: (id: string) => void;
  onClearRamPacks: () => void;
}

export const UserPacksUploader: React.FC<UserPacksUploaderProps> = ({
  theme,
  channelName,
  sourceMode,
  onChangeSourceMode,
  myVideos,
  myVideoPacks,
  selectedCloudVideoId,
  selectedCloudPackIds,
  onSelectCloudVideo,
  onToggleCloudPack,
  onSelectAllCloudPacksInVideo,
  onClearCloudSelection,
  ramPacks,
  onAddRamPack,
  onRemoveRamPack,
  onClearRamPacks,
}) => {
  const isLight = theme === 'light';
  const displayChannel = channelName.trim() || 'Sin canal configurado (Ajustes)';

  return (
    <div
      className={`xl:col-span-7 rounded-2xl border p-5 space-y-4 ${
        isLight
          ? 'bg-white border-neutral-200'
          : 'bg-neutral-900/50 border-neutral-800/80'
      }`}
    >
      {/* Top Header + Minimalist Mode Switch */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
          isLight ? 'border-neutral-200' : 'border-neutral-800/60'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-bold">1. Tus Packs a Comparar</h2>

          <div
            className={`inline-flex items-center p-1 rounded-xl border ${
              isLight
                ? 'bg-neutral-100 border-neutral-200'
                : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            <button
              type="button"
              onClick={() => onChangeSourceMode('cloud')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'cloud'
                  ? 'bg-red-600 text-white font-semibold shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Mis Videos</span>
              {selectedCloudPackIds.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold tabular-nums ${
                    sourceMode === 'cloud'
                      ? 'bg-black/25 text-white'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {selectedCloudPackIds.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onChangeSourceMode('ram')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'ram'
                  ? 'bg-red-600 text-white font-semibold shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test Rápido</span>
              {ramPacks.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold tabular-nums ${
                    sourceMode === 'ram'
                      ? 'bg-black/25 text-white'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {ramPacks.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="text-xs text-neutral-400 shrink-0">
          Canal:{' '}
          <strong className={isLight ? 'text-neutral-900' : 'text-white'}>
            {displayChannel}
          </strong>
        </div>
      </div>

      {sourceMode === 'cloud' ? (
        <CloudVideoPackPicker
          theme={theme}
          myVideos={myVideos}
          myVideoPacks={myVideoPacks}
          selectedVideoId={selectedCloudVideoId}
          selectedPackIds={selectedCloudPackIds}
          onSelectVideo={onSelectCloudVideo}
          onTogglePack={onToggleCloudPack}
          onSelectAllPacksInVideo={onSelectAllCloudPacksInVideo}
          onClearCloudSelection={onClearCloudSelection}
        />
      ) : (
        <QuickRamPackUploader
          theme={theme}
          ramPacks={ramPacks}
          onAddRamPack={onAddRamPack}
          onRemoveRamPack={onRemoveRamPack}
          onClearRamPacks={onClearRamPacks}
        />
      )}
    </div>
  );
};
