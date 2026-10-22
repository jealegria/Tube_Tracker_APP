import React, { useState, useRef } from 'react';
import { UploadCloud, Plus, Trash2, X } from 'lucide-react';
import { UserDraftPack, getDeterministicMeta } from './types';

interface UserPacksUploaderProps {
  theme: 'dark' | 'light';
  channelName: string;
  userPacks: UserDraftPack[];
  onAddPack: (pack: UserDraftPack) => void;
  onRemovePack: (id: string) => void;
  onClearAllPacks: () => void;
}

export const UserPacksUploader: React.FC<UserPacksUploaderProps> = ({
  theme,
  channelName,
  userPacks,
  onAddPack,
  onRemovePack,
  onClearAllPacks,
}) => {
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftThumbUrl, setDraftThumbUrl] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  const displayChannel = channelName.trim() || 'Sin canal configurado (Ajustes)';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraftError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDraftThumbUrl(url);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDraftError(null);

    if (!draftThumbUrl) {
      setDraftError('Sube una miniatura para agregar este pack.');
      return;
    }
    if (!draftTitle.trim()) {
      setDraftError('Escribe un título para este pack.');
      return;
    }

    const meta = getDeterministicMeta(`${Date.now()}-${draftTitle}`);
    const newPack: UserDraftPack = {
      id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: draftTitle.trim(),
      thumbnailUrl: draftThumbUrl,
      duration: meta.duration,
      viewsLabel: meta.viewsLabel,
      timeAgoLabel: '2 hours ago',
    };

    onAddPack(newPack);
    setDraftTitle('');
    setDraftThumbUrl(null);
  };

  return (
    <div
      className={`xl:col-span-7 rounded-2xl border p-5 space-y-5 ${
        isLight
          ? 'bg-white border-neutral-200'
          : 'bg-neutral-900/50 border-neutral-800/80'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800/60">
        <div>
          <h2 className="text-sm font-bold">1. Cargar tus Packs de Prueba</h2>
          <p className="text-xs text-neutral-500">
            Sube uno o varios packs (miniatura + título) para competir en el feed.
          </p>
        </div>

        <div className="text-xs text-neutral-400 shrink-0">
          Canal:{' '}
          <strong className={isLight ? 'text-neutral-900' : 'text-white'}>
            {displayChannel}
          </strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
          <div className="sm:col-span-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative aspect-video w-full rounded-xl border border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-colors ${
                draftThumbUrl
                  ? 'border-red-500/60 bg-black'
                  : isLight
                  ? 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                  : 'border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-neutral-400'
              }`}
            >
              {draftThumbUrl ? (
                <>
                  <img
                    src={draftThumbUrl}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDraftThumbUrl(null);
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/80 text-white hover:bg-black"
                    title="Quitar imagen"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-1 p-2 text-center">
                  <UploadCloud className="w-5 h-5 text-red-500" />
                  <span className="text-[11px] font-medium">Subir miniatura</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div className="sm:col-span-8 flex flex-col justify-between gap-2.5 h-full">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-neutral-400">
                Título del Pack #{userPacks.length + 1}
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => {
                  setDraftTitle(e.target.value);
                  if (draftError) setDraftError(null);
                }}
                placeholder="Escribe el título del video y presiona OK..."
                className={`w-full border rounded-xl px-3 py-2.5 text-xs outline-none ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-300 focus:border-red-500 text-neutral-900'
                    : 'bg-neutral-950 border-neutral-800 focus:border-red-500 text-white'
                }`}
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-0.5">
              {draftError ? (
                <span className="text-[11px] text-red-400">{draftError}</span>
              ) : (
                <span className="text-[11px] text-neutral-500">
                  Puedes cambiar el canal por defecto en Ajustes
                </span>
              )}

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>OK · Agregar Pack</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {userPacks.length > 0 && (
        <div
          className={`pt-4 border-t space-y-2.5 ${
            isLight ? 'border-neutral-200' : 'border-neutral-800/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-400">
              Tus packs cargados ({userPacks.length})
            </span>
            <button
              type="button"
              onClick={onClearAllPacks}
              className="text-[11px] text-neutral-500 hover:text-red-400 transition-colors"
            >
              Eliminar todos
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {userPacks.map((pack, idx) => (
              <div
                key={pack.id}
                className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-200'
                    : 'bg-neutral-950/70 border-neutral-800'
                }`}
              >
                <img
                  src={pack.thumbnailUrl}
                  alt={pack.title}
                  className="w-20 aspect-video object-cover rounded-lg shrink-0 bg-neutral-900"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-red-500 block">
                    Pack #{idx + 1}
                  </span>
                  <p className="text-xs font-medium truncate" title={pack.title}>
                    {pack.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemovePack(pack.id)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                  title="Eliminar este pack"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
