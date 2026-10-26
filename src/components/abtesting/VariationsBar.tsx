import React from 'react';
import { FolderKanban, Zap } from 'lucide-react';
import { UserVideoFolder, UserVideoPack } from '../../types';
import {
  ABTestVariation,
  ABDeviceType,
  ABPlacementMode,
} from './types';
import { ABCloudPackSelector } from './ABCloudPackSelector';
import { ABQuickTestBar } from './ABQuickTestBar';

export type ABSourceMode = 'cloud' | 'quick';

interface VariationsBarProps {
  theme: 'dark' | 'light';
  channelName: string;
  sourceMode: ABSourceMode;
  onChangeSourceMode: (mode: ABSourceMode) => void;
  device: ABDeviceType;
  placement: ABPlacementMode;
  // Mis Videos ("cloud") props
  myVideos: UserVideoFolder[];
  myVideoPacks: UserVideoPack[];
  selectedCloudVideoId: string | null;
  selectedCloudPackId: string | null;
  onSelectCloudVideo: (videoId: string) => void;
  onSelectCloudPack: (packId: string) => void;
  // Test Rápido ("quick") props
  quickVariations: ABTestVariation[];
  activeQuickVariationId: string | null;
  onSelectQuickVariation: (id: string) => void;
  onAddQuickVariation: (title: string, thumbnailUrl: string) => void;
  onDeleteQuickVariation: (id: string) => void;
}

export const VariationsBar: React.FC<VariationsBarProps> = ({
  theme,
  channelName,
  sourceMode,
  onChangeSourceMode,
  device,
  placement,
  myVideos,
  myVideoPacks,
  selectedCloudVideoId,
  selectedCloudPackId,
  onSelectCloudVideo,
  onSelectCloudPack,
  quickVariations,
  activeQuickVariationId,
  onSelectQuickVariation,
  onAddQuickVariation,
  onDeleteQuickVariation,
}) => {
  const isLight = theme === 'light';
  const displayChannel = channelName.trim() || 'Mi Canal';

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 space-y-4 ${
        isLight
          ? 'bg-white border-neutral-200'
          : 'bg-neutral-900/50 border-neutral-800/80'
      }`}
    >
      {/* Minimalist Top Bar: Mode Switch (Mis Videos vs Test Rápido) */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
          isLight ? 'border-neutral-200' : 'border-neutral-800/70'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-bold">Testing</h2>

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
            </button>

            <button
              type="button"
              onClick={() => onChangeSourceMode('quick')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                sourceMode === 'quick'
                  ? 'bg-red-600 text-white font-semibold shadow-xs'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Test Rápido</span>
              {quickVariations.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold tabular-nums ${
                    sourceMode === 'quick'
                      ? 'bg-black/25 text-white'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {quickVariations.length}
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

      {/* Mode Content */}
      {sourceMode === 'cloud' ? (
        <ABCloudPackSelector
          theme={theme}
          myVideos={myVideos}
          myVideoPacks={myVideoPacks}
          selectedVideoId={selectedCloudVideoId}
          selectedPackId={selectedCloudPackId}
          device={device}
          placement={placement}
          onSelectVideo={onSelectCloudVideo}
          onSelectPack={onSelectCloudPack}
        />
      ) : (
        <ABQuickTestBar
          theme={theme}
          variations={quickVariations}
          activeVariationId={activeQuickVariationId}
          device={device}
          placement={placement}
          onSelectVariation={onSelectQuickVariation}
          onAddVariation={onAddQuickVariation}
          onDeleteVariation={onDeleteQuickVariation}
        />
      )}
    </div>
  );
};
