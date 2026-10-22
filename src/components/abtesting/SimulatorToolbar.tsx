import React from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Tv,
  Sun,
  Moon,
  LayoutGrid,
  PanelRight,
  Maximize2,
  Shuffle,
} from 'lucide-react';
import {
  ABPlacementMode,
  ABDeviceType,
  ABPreviewTheme,
  YOUTUBE_SPECS,
} from './types';

interface SimulatorToolbarProps {
  appTheme: 'dark' | 'light';
  placement: ABPlacementMode;
  device: ABDeviceType;
  previewTheme: ABPreviewTheme;
  onChangePlacement: (p: ABPlacementMode) => void;
  onChangeDevice: (d: ABDeviceType) => void;
  onChangePreviewTheme: (t: ABPreviewTheme) => void;
  onShuffleCompetitors: () => void;
}

export const SimulatorToolbar: React.FC<SimulatorToolbarProps> = ({
  appTheme,
  placement,
  device,
  previewTheme,
  onChangePlacement,
  onChangeDevice,
  onChangePreviewTheme,
  onShuffleCompetitors,
}) => {
  const isLight = appTheme === 'light';
  const currentSpec = YOUTUBE_SPECS[device][placement];

  const devices: { id: ABDeviceType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'pc', label: 'PC', icon: Monitor },
    { id: 'mobile', label: 'Mobile', icon: Smartphone },
    { id: 'tablet', label: 'Tablet', icon: Tablet },
    { id: 'tv', label: 'TV', icon: Tv },
  ];

  const placementLabels: Record<ABDeviceType, { home: string; sidebar: string; fullscreen?: string }> = {
    pc: {
      home: 'Homepage',
      sidebar: 'Sidebar (Viendo un video)',
    },
    mobile: {
      home: 'Homepage',
      sidebar: 'Sidebar (Vertical)',
      fullscreen: 'Fullscreen Horizontal (Más videos)',
    },
    tablet: {
      home: 'Homepage',
      sidebar: 'Sidebar (Viendo un video)',
    },
    tv: {
      home: 'Homepage',
      sidebar: 'Sugeridos (Viendo un video)',
    },
  };

  const activeDeviceLabel = devices.find((d) => d.id === device)?.label || 'PC';

  return (
    <div
      className={`rounded-2xl border p-3.5 space-y-3 ${
        isLight
          ? 'bg-white border-neutral-200'
          : 'bg-neutral-900/60 border-neutral-800/80'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* STEP 1: Device Selection First (PC | Mobile | Tablet | TV) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              1. Dispositivo:
            </span>
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border ${
                isLight
                  ? 'bg-neutral-100 border-neutral-200'
                  : 'bg-neutral-950 border-neutral-800'
              }`}
            >
              {devices.map((d) => {
                const Icon = d.icon;
                const active = device === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onChangeDevice(d.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? isLight
                          ? 'bg-neutral-900 text-white shadow-sm'
                          : 'bg-white text-neutral-950 shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{d.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Placement Selection based on selected Device */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              2. Vista en {activeDeviceLabel}:
            </span>
            <div
              className={`flex flex-wrap items-center gap-1 p-1 rounded-xl border ${
                isLight
                  ? 'bg-neutral-100 border-neutral-200'
                  : 'bg-neutral-950 border-neutral-800'
              }`}
            >
              <button
                type="button"
                onClick={() => onChangePlacement('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  placement === 'home'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{placementLabels[device].home}</span>
              </button>

              <button
                type="button"
                onClick={() => onChangePlacement('sidebar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                  placement === 'sidebar'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <PanelRight className="w-3.5 h-3.5" />
                <span>{placementLabels[device].sidebar}</span>
              </button>

              {device === 'mobile' && (
                <button
                  type="button"
                  onClick={() => onChangePlacement('fullscreen')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                    placement === 'fullscreen'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{placementLabels.mobile.fullscreen}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* YouTube Preview Theme Toggle (Oscuro / Brillante) + Shuffle */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border ${
              isLight
                ? 'bg-neutral-100 border-neutral-200'
                : 'bg-neutral-950 border-neutral-800'
            }`}
          >
            <button
              type="button"
              onClick={() => onChangePreviewTheme('dark')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewTheme === 'dark'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Oscuro</span>
            </button>

            <button
              type="button"
              onClick={() => onChangePreviewTheme('light')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewTheme === 'light'
                  ? 'bg-white text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Brillante</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onShuffleCompetitors}
            className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Rotar posición y videos acompañantes"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rotar entorno</span>
          </button>
        </div>
      </div>

      {/* Exact Official YouTube Spec Readout */}
      <div
        className={`pt-2.5 border-t flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 ${
          isLight ? 'border-neutral-200' : 'border-neutral-800/70'
        }`}
      >
        <span>{currentSpec.description}</span>
        <span className="tabular-nums">
          Proporción: <strong>{currentSpec.thumbRatio}</strong> · Corte de título:{' '}
          <strong>~{currentSpec.charsPerLine} caract./línea (máx {currentSpec.maxLines} líneas)</strong>
        </span>
      </div>
    </div>
  );
};
