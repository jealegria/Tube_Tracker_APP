import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Trash2,
  Pencil,
  Check,
  X,
  Download,
  Loader2,
} from 'lucide-react';
import { UserVideoPack } from '../../types';
import { compressThumbnailFile } from '../../utils/imageCompression';

export interface PackSlotCardProps {
  slotIndex: number;
  videoId: string;
  existingPack?: UserVideoPack;
  theme: 'dark' | 'light';
  channelName: string;
  onSavePack: (
    videoId: string,
    orderIndex: number,
    title: string,
    thumbnailUrl: string,
    existingPackId?: string
  ) => Promise<void>;
  onDeletePack: (packId: string) => Promise<void>;
}

export const PackSlotCard: React.FC<PackSlotCardProps> = ({
  slotIndex,
  videoId,
  existingPack,
  theme,
  channelName,
  onSavePack,
  onDeletePack,
}) => {
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(existingPack?.title || '');
  const [draftThumb, setDraftThumb] = useState<string | null>(existingPack?.thumbnailUrl || null);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const packLetter = String.fromCharCode(65 + slotIndex);

  const startEditing = () => {
    setDraftTitle(existingPack?.title || '');
    setDraftThumb(existingPack?.thumbnailUrl || null);
    setErrorMsg(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraftTitle(existingPack?.title || '');
    setDraftThumb(existingPack?.thumbnailUrl || null);
    setErrorMsg(null);
    setIsEditing(false);
  };

  const handleFileSelect = async (file?: File) => {
    if (!file) return;
    setErrorMsg(null);
    setIsProcessingImg(true);
    try {
      const compressedDataUrl = await compressThumbnailFile(file);
      setDraftThumb(compressedDataUrl);
      if (!existingPack && !isEditing) {
        setIsEditing(true);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar la imagen.');
    } finally {
      setIsProcessingImg(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!draftThumb) {
      setErrorMsg('Sube una miniatura para guardar este pack.');
      return;
    }
    if (!draftTitle.trim()) {
      setErrorMsg('Escribe un título para este pack.');
      return;
    }

    setIsSaving(true);
    try {
      await onSavePack(
        videoId,
        slotIndex,
        draftTitle.trim(),
        draftThumb,
        existingPack?.id
      );
      setIsEditing(false);
    } catch {
      setErrorMsg('No se pudo guardar en la nube. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadThumbnail = () => {
    if (!existingPack) return;
    const link = document.createElement('a');
    link.href = existingPack.thumbnailUrl;
    const safeName = existingPack.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    link.download = `pack-${slotIndex + 1}-${safeName || 'thumbnail'}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (existingPack && !isEditing) {
    return (
      <div
        className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all ${
          isLight
            ? 'bg-white border-neutral-200 shadow-xs'
            : 'bg-neutral-900/60 border-neutral-800/90'
        }`}
      >
        <div>
          <div className="relative aspect-video w-full bg-black overflow-hidden group">
            <img
              src={existingPack.thumbnailUrl}
              alt={existingPack.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-lg bg-red-600 text-white text-[11px] font-bold shadow-sm">
                Pack #{slotIndex + 1} ({packLetter})
              </span>
            </div>

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={startEditing}
                className="px-3 py-1.5 rounded-xl bg-white text-neutral-950 text-xs font-semibold flex items-center gap-1.5 hover:bg-neutral-200 transition-colors cursor-pointer shadow"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar Pack</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadThumbnail}
                className="p-2 rounded-xl bg-neutral-900/90 text-white hover:bg-neutral-800 transition-colors cursor-pointer shadow"
                title="Descargar miniatura a tu PC"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-2">
            <p
              className={`text-sm font-semibold leading-snug line-clamp-2 ${
                isLight ? 'text-neutral-900' : 'text-neutral-100'
              }`}
              title={existingPack.title}
            >
              {existingPack.title}
            </p>
            <div className="flex items-center justify-between text-[11px] text-neutral-500">
              <span className="truncate">{channelName || 'Mi Canal'}</span>
              <span className="tabular-nums shrink-0">
                {existingPack.title.length} caract.
              </span>
            </div>
          </div>
        </div>

        <div
          className={`px-4 py-2.5 border-t flex items-center justify-between gap-2 ${
            isLight ? 'border-neutral-100 bg-neutral-50/60' : 'border-neutral-800/70 bg-neutral-950/40'
          }`}
        >
          <button
            type="button"
            onClick={startEditing}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLight
                ? 'text-neutral-700 hover:bg-neutral-200/70'
                : 'text-neutral-300 hover:bg-neutral-800'
            }`}
          >
            <Pencil className="w-3.5 h-3.5 text-red-500" />
            <span>Editar imagen o título</span>
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void onDeletePack(existingPack.id)}
                className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-semibold cursor-pointer"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="p-1 text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 rounded-lg text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Eliminar este pack"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className={`rounded-2xl border p-4 flex flex-col justify-between space-y-3.5 transition-all ${
        existingPack || isEditing
          ? isLight
            ? 'bg-white border-red-500/50 ring-1 ring-red-500/20'
            : 'bg-neutral-900/90 border-red-500/50 ring-1 ring-red-500/20'
          : isLight
          ? 'bg-white/70 border-neutral-300 border-dashed hover:border-neutral-400'
          : 'bg-neutral-900/30 border-neutral-800 border-dashed hover:border-neutral-700'
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
            Pack #{slotIndex + 1} · Opción {packLetter}
          </span>
          {existingPack && (
            <button
              type="button"
              onClick={cancelEditing}
              className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          )}
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) void handleFileSelect(file);
          }}
          className={`relative aspect-video w-full rounded-xl border border-dashed overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-colors ${
            draftThumb
              ? 'border-red-500/60 bg-black'
              : isLight
              ? 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
              : 'border-neutral-700 bg-neutral-950 hover:bg-neutral-900 text-neutral-400'
          }`}
        >
          {isProcessingImg ? (
            <div className="flex flex-col items-center gap-2 p-3 text-center">
              <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
              <span className="text-xs font-medium">Optimizando miniatura HD...</span>
            </div>
          ) : draftThumb ? (
            <>
              <img
                src={draftThumb}
                alt="Previsualización"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/80 text-white text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-xs">
                <UploadCloud className="w-3.5 h-3.5 text-red-400" />
                <span>Cambiar imagen</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 p-4 text-center">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold">
                Subir miniatura del Pack #{slotIndex + 1}
              </span>
              <span className="text-[11px] text-neutral-500">
                Haz clic o arrastra una imagen (16:9 HD)
              </span>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <label className="font-medium text-neutral-400">Título del video</label>
            <span className="text-neutral-500 tabular-nums">{draftTitle.length}/100</span>
          </div>
          <textarea
            rows={2}
            value={draftTitle}
            onChange={(e) => {
              setDraftTitle(e.target.value);
              if (errorMsg) setErrorMsg(null);
              if (!isEditing) setIsEditing(true);
            }}
            placeholder={`Escribe el título para el Pack #${slotIndex + 1}...`}
            className={`w-full border rounded-xl px-3 py-2 text-xs outline-none resize-none ${
              isLight
                ? 'bg-neutral-50 border-neutral-300 focus:border-red-500 text-neutral-900'
                : 'bg-neutral-950 border-neutral-800 focus:border-red-500 text-white'
            }`}
          />
        </div>

        {errorMsg && <p className="text-[11px] text-red-400">{errorMsg}</p>}
      </div>

      <button
        type="submit"
        disabled={isSaving || isProcessingImg}
        className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Guardando en la nube...</span>
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>{existingPack ? 'Guardar Cambios' : `Guardar Pack #${slotIndex + 1}`}</span>
          </>
        )}
      </button>
    </form>
  );
};
