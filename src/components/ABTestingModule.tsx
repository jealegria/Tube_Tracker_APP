import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, FlaskConical } from 'lucide-react';
import { PackagingItem } from '../types';
import { ProfileId } from '../firebase';
import {
  ABTestVideoProject,
  ABTestVariation,
  ABPlacementMode,
  ABDeviceType,
  ABPreviewTheme,
} from './abtesting/types';
import { ProjectListGrid } from './abtesting/ProjectListGrid';
import { VariationsBar } from './abtesting/VariationsBar';
import { SimulatorToolbar } from './abtesting/SimulatorToolbar';
import { YouTubeDeviceSimulator } from './abtesting/YouTubeDeviceSimulator';
import { fisherYatesShuffle } from './compare/types';

interface ABTestingModuleProps {
  theme: 'dark' | 'light';
  activeProfile: ProfileId;
  defaultChannelName: string;
  items: PackagingItem[];
}

const getABStorageKey = (profileId: ProfileId) => `tubeswipe_abtesting_${profileId}_v1`;

export const ABTestingModule: React.FC<ABTestingModuleProps> = ({
  theme,
  activeProfile,
  defaultChannelName,
  items,
}) => {
  const isLight = theme === 'light';

  const [projects, setProjects] = useState<ABTestVideoProject[]>(() => {
    try {
      const saved = localStorage.getItem(getABStorageKey(activeProfile));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  // Reload projects when activeProfile changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(getABStorageKey(activeProfile));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setProjects(parsed);
          return;
        }
      }
    } catch {
      // ignore storage errors
    }
    setProjects([]);
  }, [activeProfile]);

  // Save projects to localStorage (note: object URLs for session images work seamlessly in session)
  useEffect(() => {
    try {
      localStorage.setItem(getABStorageKey(activeProfile), JSON.stringify(projects));
    } catch {
      // ignore storage quota errors
    }
  }, [projects, activeProfile]);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeVariationId, setActiveVariationId] = useState<string | null>(null);

  // Simulator controls
  const [placement, setPlacement] = useState<ABPlacementMode>('home');
  const [device, setDevice] = useState<ABDeviceType>('pc');
  const [previewTheme, setPreviewTheme] = useState<ABPreviewTheme>(theme);
  const [surroundingItems, setSurroundingItems] = useState<PackagingItem[]>([]);
  const [userPositionIndex, setUserPositionIndex] = useState<number>(1);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

  // Ensure an active variation is selected when opening a project
  useEffect(() => {
    if (!selectedProject) {
      setActiveVariationId(null);
      return;
    }
    if (
      selectedProject.variations.length > 0 &&
      !selectedProject.variations.some((v) => v.id === activeVariationId)
    ) {
      setActiveVariationId(selectedProject.variations[0].id);
    }
  }, [selectedProject, activeVariationId]);

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
        // Primary visible Up Next card right below the Comments box
        setUserPositionIndex(0);
      } else {
        // Mobile Homepage & Mobile Fullscreen Horizontal: always in the 2 full visible slots (index 0 or 1)
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

  const handleCreateProject = (name: string) => {
    const nextNumber =
      projects.length > 0
        ? Math.max(...projects.map((p) => p.videoNumber)) + 1
        : 1;
    const newProj: ABTestVideoProject = {
      id: `abproj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      videoNumber: nextNumber,
      name,
      variations: [],
      createdAt: Date.now(),
    };
    setProjects((prev) => [newProj, ...prev]);
    setSelectedProjectId(newProj.id);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (selectedProjectId === projectId) {
      setSelectedProjectId(null);
    }
  };

  const handleAddVariation = (title: string, thumbnailUrl: string) => {
    if (!selectedProject) return;
    const letter = String.fromCharCode(65 + (selectedProject.variations.length % 26));
    const newVar: ABTestVariation = {
      id: `abvar-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: `Var ${letter}`,
      title,
      thumbnailUrl,
      createdAt: Date.now(),
    };

    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProject.id
          ? { ...p, variations: [...p.variations, newVar] }
          : p
      )
    );
    setActiveVariationId(newVar.id);
  };

  const handleDeleteVariation = (varId: string) => {
    if (!selectedProject) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProject.id
          ? { ...p, variations: p.variations.filter((v) => v.id !== varId) }
          : p
      )
    );
  };

  if (!selectedProject) {
    return (
      <ProjectListGrid
        theme={theme}
        projects={projects}
        onCreateProject={handleCreateProject}
        onSelectProject={(id) => setSelectedProjectId(id)}
        onDeleteProject={handleDeleteProject}
      />
    );
  }

  const activeVariation =
    selectedProject.variations.find((v) => v.id === activeVariationId) || null;

  return (
    <div className="space-y-5 pb-12">
      {/* Top Bar inside Selected Video Project */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${
          isLight ? 'border-neutral-200' : 'border-neutral-800/70'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedProjectId(null)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLight
                ? 'bg-white border-neutral-200 hover:bg-neutral-100 text-neutral-700'
                : 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Todos los videos</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                Video #{selectedProject.videoNumber}
              </span>
              <h2 className="text-sm font-bold">{selectedProject.name}</h2>
            </div>
          </div>
        </div>

        <div className="text-xs text-neutral-400">
          Canal:{' '}
          <strong className={isLight ? 'text-neutral-900' : 'text-white'}>
            {defaultChannelName.trim() || 'Mi Canal'}
          </strong>
        </div>
      </div>

      {/* Variations Uploader & Selector Strip */}
      <VariationsBar
        theme={theme}
        variations={selectedProject.variations}
        activeVariationId={activeVariationId}
        device={device}
        placement={placement}
        onSelectVariation={setActiveVariationId}
        onAddVariation={handleAddVariation}
        onDeleteVariation={handleDeleteVariation}
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
