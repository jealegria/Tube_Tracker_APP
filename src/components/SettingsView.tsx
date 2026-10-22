import React, { useState, useEffect } from 'react';
import { Settings, Check, Tv } from 'lucide-react';
import { ProfileId, PROFILES } from '../firebase';

interface SettingsViewProps {
  theme: 'dark' | 'light';
  activeProfile: ProfileId;
  defaultChannelName: string;
  onSaveDefaultChannel: (newName: string) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  activeProfile,
  defaultChannelName,
  onSaveDefaultChannel,
}) => {
  const isLight = theme === 'light';
  const profileName = PROFILES[activeProfile].name;

  const [channelInput, setChannelInput] = useState(defaultChannelName);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setChannelInput(defaultChannelName);
  }, [defaultChannelName, activeProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveDefaultChannel(channelInput);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6 pb-12">
      <div
        className={`pb-4 border-b ${
          isLight ? 'border-neutral-200' : 'border-neutral-800/70'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-red-500" />
          <h1 className="text-lg font-bold tracking-tight">
            Ajustes del Perfil · {profileName}
          </h1>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Parámetros globales guardados específicamente para el perfil de{' '}
          <strong>{profileName}</strong>.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={`rounded-2xl border p-5 space-y-4 ${
          isLight
            ? 'bg-white border-neutral-200'
            : 'bg-neutral-900/50 border-neutral-800/80'
        }`}
      >
        <div className="space-y-1">
          <label className="text-xs font-semibold flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-red-500" />
            <span>Canal por defecto al comparar packs</span>
          </label>
          <p className="text-xs text-neutral-500">
            Nombre del canal que se utilizará automáticamente cuando subas y compares tus packs en el perfil de{' '}
            <strong>{profileName}</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
          <input
            type="text"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
            placeholder={
              activeProfile === 'johnny'
                ? 'Ej: Johnny BT'
                : 'Escribe el nombre del canal de Guido...'
            }
            className={`flex-1 border rounded-xl px-3.5 py-2.5 text-xs font-medium outline-none transition-colors ${
              isLight
                ? 'bg-neutral-50 border-neutral-300 focus:border-red-500 text-neutral-900 placeholder:text-neutral-400'
                : 'bg-neutral-950 border-neutral-800 focus:border-red-500 text-white placeholder:text-neutral-500'
            }`}
          />

          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Guardado!</span>
              </>
            ) : (
              <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
