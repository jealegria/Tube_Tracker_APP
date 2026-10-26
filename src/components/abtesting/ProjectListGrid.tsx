import React, { useState } from 'react';
import {
  FlaskConical,
  Plus,
  Trash2,
  Layers,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';
import { ABTestVideoProject } from './types';

interface ProjectListGridProps {
  theme: 'dark' | 'light';
  projects: ABTestVideoProject[];
  onCreateProject: (name: string) => void;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectListGrid: React.FC<ProjectListGridProps> = ({
  theme,
  projects,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
}) => {
  const isLight = theme === 'light';
  const [newProjectName, setNewProjectName] = useState('');

  const nextVideoNumber =
    projects.length > 0
      ? Math.max(...projects.map((p) => p.videoNumber)) + 1
      : 1;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newProjectName.trim() || `Video #${nextVideoNumber}`;
    onCreateProject(label);
    setNewProjectName('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header + Create New Video Test Project */}
      <div
        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
          isLight ? 'border-neutral-200' : 'border-neutral-800/70'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-red-500" />
            <h1 className="text-lg font-bold tracking-tight">
              Testing de Packagings
            </h1>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Crea un contenedor para cada video, sube todas tus variaciones de miniatura/título y pruébalas en un clon 1:1 de YouTube (PC, Mobile, Tablet y TV).
          </p>
        </div>

        <form onSubmit={handleCreateSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder={`Nombre opcional (ej: Video #${nextVideoNumber})...`}
            className={`border rounded-xl px-3.5 py-2 text-xs outline-none w-60 ${
              isLight
                ? 'bg-white border-neutral-300 focus:border-red-500 text-neutral-900'
                : 'bg-neutral-900 border-neutral-800 focus:border-red-500 text-white'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Video #{nextVideoNumber}</span>
          </button>
        </form>
      </div>

      {/* Video Projects Grid */}
      {projects.length === 0 ? (
        <div
          className={`py-20 text-center border border-dashed rounded-2xl space-y-3 ${
            isLight
              ? 'border-neutral-300 bg-white/60'
              : 'border-neutral-800 bg-neutral-900/20'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto text-neutral-500 ${
              isLight
                ? 'bg-neutral-100 border-neutral-200'
                : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">
              Aún no tienes videos en Testing
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Crea el <strong>Video #1</strong> arriba para subir tus variaciones de miniatura y título y simularlas en PC, Mobile, Tablet y Smart TV.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCreateProject(`Video #1`)}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Video #1 ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const count = proj.variations.length;
            const previewVariations = proj.variations.slice(0, 4);

            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj.id)}
                className={`group rounded-2xl border p-4 flex flex-col justify-between gap-4 cursor-pointer transition-all ${
                  isLight
                    ? 'bg-white border-neutral-200 hover:border-neutral-400 shadow-sm'
                    : 'bg-neutral-900/50 border-neutral-800/90 hover:border-neutral-600'
                }`}
              >
                {/* Thumbnail Strip Preview */}
                <div className="space-y-3">
                  <div
                    className={`aspect-video w-full rounded-xl overflow-hidden border grid ${
                      previewVariations.length <= 1
                        ? 'grid-cols-1'
                        : 'grid-cols-2 gap-0.5'
                    } ${
                      isLight
                        ? 'bg-neutral-100 border-neutral-200'
                        : 'bg-neutral-950 border-neutral-800'
                    }`}
                  >
                    {previewVariations.length === 0 ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-500 gap-1.5">
                        <ImageIcon className="w-6 h-6" />
                        <span className="text-[11px]">Sin variaciones subidas</span>
                      </div>
                    ) : (
                      previewVariations.map((v) => (
                        <div key={v.id} className="relative w-full h-full overflow-hidden bg-black">
                          <img
                            src={v.thumbnailUrl}
                            alt={v.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                            {v.label}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">
                        Video #{proj.videoNumber}
                      </span>
                      <h3 className="text-sm font-bold truncate mt-0.5" title={proj.name}>
                        {proj.name}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(proj.id);
                      }}
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                      title="Eliminar este video"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div
                  className={`pt-3 border-t flex items-center justify-between text-xs ${
                    isLight ? 'border-neutral-200' : 'border-neutral-800/80'
                  }`}
                >
                  <span className="text-neutral-400 tabular-nums">
                    <strong className={isLight ? 'text-neutral-900' : 'text-white'}>
                      {count}
                    </strong>{' '}
                    {count === 1 ? 'variación subida' : 'variaciones subidas'}
                  </span>

                  <span className="text-red-500 font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Abrir laboratorio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
