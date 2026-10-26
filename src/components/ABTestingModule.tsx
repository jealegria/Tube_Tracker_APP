import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PackagingItem, UserVideoFolder, UserVideoPack } from '../types';
import { ProfileId } from '../firebase';
import {
  ABTestVariation,
  ABPlacementMode,
  ABDeviceType,
  ABPreviewTheme,
} from './abtesting/types';
import { VariationsBar, ABSourceMode } from './abtesting/VariationsBar';
import { SimulatorToolbar } from './abtesting/SimulatorToolbar';
import { YouTubeDeviceSimulator } from './abtesting/YouTubeDeviceSimulator';
import { fisherYatesShuffle } from './compare/types';

interface TestingModuleProps {
  theme: 'dark' | 'light';
  activeProfile: ProfileId;
  defaultChannelName: string;
  items: PackagingItem[];
  myVideos: UserVideoFolder[];
  myVideoPacks: UserVideoPack[];
}

export const TestingModule: React.FC<TestingModuleProps> = ({
  theme,
  defaultChannelName,
  items,
  myVideos,
  myVideoPacks,
}) => {
  // Mode: 'cloud' (Mis Videos) vs 'quick' (Test Rápido)
  const [sourceMode, setSourceMode] = useState<ABSourceMode>(() =>
    myVideos.length > 0 ? 'cloud' : 'quick'
  );

  // Cloud ("Mis Videos") selection
  const [selectedCloudVideoId, setSelectedCloudVideoId] = useState<string | null>(null);
  const [selectedCloudPackId, setSelectedCloudPackId] = useState<string | null>(null);

  // Quick Test ("Test Rápido") variations
  const [quickVariations, setQuickVariations] = useState<ABTestVariation[]>([]);
  const [activeQuickVariationId, setActiveQuickVariationId] = useState<string | null>(null);

  // Simulator controls
  const [placement, setPlacement] = useState<ABPlacementMode>('home');
  const [device, setDevice] = useState<ABDeviceType>('pc');
  const [previewTheme, setPreviewTheme] = useState<ABPreviewTheme>(theme);
  const [surroundingItems, setSurroundingItems] = useState<PackagingItem[]>([]);
  const [userPositionIndex, setUserPositionIndex] = useState<number>(1);

  const handleDeviceChange = (newDevice: ABDeviceType) => {
    setDevice(newDevice);
    if (newDevice !== 'mobile' && placement === 'fullscreen') {
      setPlacement('sidebar');
    }
  };

  const shuffleContext = useCallback(() => {
    const shuffled = fisherYatesShuffle(items).slice(0, 12);
    setSurroundingItems(shuffled);

    if (device === 'mobile') {
      if (placement === 'sidebar') {
        setUserPositionIndex(0);
      } else {
        setUserPositionIndex((prev) => (prev === 0 ? 1 : 0));
      }
      return;
    }

    const maxPosByContext: Record<ABDeviceType, Record<ABPlacementMode, number>> = {
      pc: { home: 5, sidebar: 3, fullscreen: 1 },
      mobile: { home: 1, sidebar: 0, fullscreen: 1 },
      tablet: { home: 3, sidebar: 2, fullscreen: 1 },
      tv: { home: 1, sidebar: 2, fullscreen: 1 },
    };

    const maxPos = maxPosByContext[device][placement];
    setUserPositionIndex(Math.floor(Math.random() * (maxPos + 1)));
  }, [items, device, placement]);

  useEffect(() => {
    shuffleContext();
  }, [shuffleContext]);

  const handleAddQuickVariation = (title: string, thumbnailUrl: string) => {
    const letter = String.fromCharCode(65 + (quickVariations.length % 26));
    const newVar: ABTestVariation = {
      id: `abvar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: `Var ${letter}`,
      title,
      thumbnailUrl,
      createdAt: Date.now(),
    };
    setQuickVariations((prev) => [...prev, newVar]);
    setActiveQuickVariationId(newVar.id);
  };

  const handleDeleteQuickVariation = (varId: string) => {
    setQuickVariations((prev) => {
      const remaining = prev.filter((v) => v.id !== varId);
      if (activeQuickVariationId === varId) {
        setActiveQuickVariationId(remaining[0]?.id || null);
      }
      return remaining;
    });
  };

  // Resolve the active variation passed into YouTubeDeviceSimulator
  const activeVariation = useMemo<ABTestVariation | null>(() => {
    if (sourceMode === 'quick') {
      return (
        quickVariations.find((v) => v.id === activeQuickVariationId) ||
        quickVariations[0] ||
        null
      );
    }

    const folderPacks = myVideoPacks
      .filter((p) => p.videoId === selectedCloudVideoId)
      .sort((a, b) => a.order - b.order);

    const chosenPack =
      folderPacks.find((p) => p.id === selectedCloudPackId) ||
      folderPacks[0] ||
      null;

    if (!chosenPack) return null;

    const letter = String.fromCharCode(65 + chosenPack.order);
    return {
      id: chosenPack.id,
      label: `Pack ${chosenPack.order + 1} (${letter})`,
      title: chosenPack.title,
      thumbnailUrl: chosenPack.thumbnailUrl,
      createdAt: chosenPack.createdAt,
    };
  }, [
    sourceMode,
    quickVariations,
    activeQuickVariationId,
    myVideoPacks,
    selectedCloudVideoId,
    selectedCloudPackId,
  ]);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Variations Selector Bar (Mis Videos | Test Rápido) */}
      <VariationsBar
        theme={theme}
        channelName={defaultChannelName}
        sourceMode={sourceMode}
        onChangeSourceMode={setSourceMode}
        device={device}
        placement={placement}
        myVideos={myVideos}
        myVideoPacks={myVideoPacks}
        selectedCloudVideoId={selectedCloudVideoId}
        selectedCloudPackId={selectedCloudPackId}
        onSelectCloudVideo={setSelectedCloudVideoId}
        onSelectCloudPack={setSelectedCloudPackId}
        quickVariations={quickVariations}
        activeQuickVariationId={activeQuickVariationId}
        onSelectQuickVariation={setActiveQuickVariationId}
        onAddQuickVariation={handleAddQuickVariation}
        onDeleteQuickVariation={handleDeleteQuickVariation}
      />

      {/* Simulator Controls: Device -> Placement -> Theme */}
      <SimulatorToolbar
        appTheme={theme}
        placement={placement}
        device={device}
        previewTheme={previewTheme}
        onChangePlacement={setPlacement}
        onChangeDevice={handleDeviceChange}
        onChangePreviewTheme={setPreviewTheme}
        onShuffleCompetitors={shuffleContext}
      />

      {/* 1:1 Official YouTube Simulator Canvas */}
      <YouTubeDeviceSimulator
        activeVariation={activeVariation}
        channelName={defaultChannelName}
        surroundingItems={surroundingItems}
        userPositionIndex={userPositionIndex}
        placement={placement}
        device={device}
        previewTheme={previewTheme}
      />
    </div>
  );
};
