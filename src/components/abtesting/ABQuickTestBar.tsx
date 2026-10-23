import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Plus,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  ABTestVariation,
  ABDeviceType,
  ABPlacementMode,
  YOUTUBE_SPECS,
} from './types';

export interface ABQuickTestBarProps {
  theme: 'dark' | 'light';
  variations: ABTestVariation[];
  activeVariationId: string | null;
  device: ABDeviceType;
  placement: ABPlacementMode;
  onSelectVariation: (id: string) => void;
  onAddVariation: (title: string, thumbnailUrl: string) => void;
  onDeleteVariation: (id: string) => void;
}

export const ABQuickTestBar: React.FC<ABQuickTestBarProps> = ({
  theme,
  variations,
  activeVariationId,
  device,
  placement,
  onSelectVariation,
  onAddVariation,
  onDeleteVariation,
}) => {
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftThumb, setDraftThumb] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const nextLetter = String.fromCharCode(65 + (variations.length % 26));
  const spec = YOUTUBE_SPECS[device][placement];
  const activeVariation = variations.find((v) => v.id === activeVariationId) || null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDraftThumb(url);
    e.target.value = '';
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!draftThumb) {
      setErrorMsg('Sube una miniatura para la variación.');
      return;
    }
    if (!draftTitle.trim()) {
      setErrorMsg('Escribe el título para la variación.');
      return;
    }
    onAddVariation(draftTitle.trim(), draftThumb);
    setDraftTitle('');
    setDraftThumb(null);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        <div className="lg:col-span-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative aspect-video w-full rounded-xl border border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-colors ${
              draftThumb
                ? 'border-red-500/60 bg-black'
                : isLight
                ? 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                : 'border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-neutral-400'
            }`}
          >
            {draftThumb ? (
              <>
                <img
                  src={draftThumb}
                  alt="Previsualización"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDraftThumb(null);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/80 text-white hover:bg-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 p-2 text-center">
                <UploadCloud className="w-5 h-5 text-red-500" />
                <span className="text-[11px] font-medium">
                  Subir miniatura (Var {nextLetter})
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        <div className="lg:col-span-9 flex flex-col justify-between gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <label className="font-semibold text-neutral-400">
                Nueva Variación {nextLetter} · Título
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setDraftTitle(
                      'Este es un titulo a modo de prueba para comprobar la longitud de caracteres en titulos de YouTube'
                    );
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-neutral-100 border-neutral-200 hover:bg-neutral-200 text-neutral-700'
                      : 'bg-neutral-800/80 border-neutral-700 hover:bg-neutral-800 text-neutral-300'
                  }`}
                  title="Insertar título de prueba para comprobar el corte de caracteres"
                >
                  Título de prueba (Debug)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDraftTitle('');
                    if (errorMsg) setErrorMsg(null);
                  }}
                  disabled={!draftTitle}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    !draftTitle
                      ? 'opacity-40 cursor-not-allowed border-transparent text-neutral-500'
                      : isLight
                      ? 'bg-neutral-100 border-neutral-200 hover:bg-red-50 hover:text-red-600 text-neutral-600 cursor-pointer'
                      : 'bg-neutral-900 border-neutral-800 hover:border-red-500/40 hover:text-red-400 text-neutral-400 cursor-pointer'
                  }`}
                  title="Borrar campo de título"
                >
                  <X className="w-3 h-3" />
                  <span>Borrar</span>
                </button>
              </div>
            </div>

            <span
              className={`tabular-nums text-[11px] ${
                draftTitle.length > spec.maxVisibleChars
                  ? 'text-amber-400 font-semibold'
                  : 'text-neutral-500'
              }`}
            >
              {draftTitle.length} / {spec.maxVisibleChars} caract. visibles en {device.toUpperCase()} (
              {placement === 'home'
                ? 'Home'
                : placement === 'fullscreen'
                ? 'Fullscreen Horizontal'
                : 'Sidebar'}
              )
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => {
                setDraftTitle(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Escribe el título de esta variación y presiona Agregar..."
              className={`flex-1 border rounded-xl px-3.5 py-2.5 text-xs outline-none ${
                isLight
                  ? 'bg-neutral-50 border-neutral-300 focus:border-red-500 text-neutral-900'
                  : 'bg-neutral-950 border-neutral-800 focus:border-red-500 text-white'
              }`}
            />

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Variación {nextLetter}</span>
            </button>
          </div>

          {errorMsg && <span className="text-[11px] text-red-400">{errorMsg}</span>}
        </div>
      </form>

      {variations.length > 0 && (
        <div
          className={`pt-3.5 border-t space-y-2.5 ${
            isLight ? 'border-neutral-200' : 'border-neutral-800/70'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-neutral-400">
              Selecciona qué variación visualizar en vivo ({variations.length} cargadas):
            </span>

            {activeVariation && (
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-neutral-500 tabular-nums">
                  Longitud título activo: <strong>{activeVariation.title.length} caract.</strong>
                </span>
                {activeVariation.title.length > spec.maxVisibleChars ? (
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

          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {variations.map((v) => {
              const isSelected = v.id === activeVariationId;
              return (
                <div
                  key={v.id}
                  onClick={() => onSelectVariation(v.id)}
                  className={`group relative flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer transition-all shrink-0 w-72 ${
                    isSelected
                      ? 'border-red-500 bg-red-600/10 ring-1 ring-red-500'
                      : isLight
                      ? 'bg-neutral-50 border-neutral-200 hover:border-neutral-300'
                      : 'bg-neutral-950/80 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isSelected ? 'bg-red-600 text-white' : 'bg-black/80 text-white'
                      }`}
                    >
                      {v.label}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2 leading-snug" title={v.title}>
                      {v.title}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteVariation(v.id);
                    }}
                    className="p-1 rounded-lg text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    title="Eliminar variación"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
