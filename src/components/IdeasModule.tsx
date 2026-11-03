import React, { useState } from 'react';
import { Lightbulb, Plus, Search, X } from 'lucide-react';
import { VideoIdea } from '../types';
import { ProfileId, PROFILES } from '../firebase';
import { IdeaCardRow } from './ideas/IdeaCardRow';
import { IdeaCreateForm } from './ideas/IdeaCreateForm';

interface IdeasModuleProps {
  theme: 'dark' | 'light';
  activeProfile: ProfileId;
  ideas: VideoIdea[];
  onAddIdea: (input: {
    sourceType: 'url' | 'upload';
    videoUrl?: string;
    videoId?: string;
    thumbnailUrl: string;
    titles: [string, string, string, string];
    notes?: string;
  }) => Promise<VideoIdea>;
  onUpdateIdea: (
    ideaId: string,
    patch: Partial<
      Pick<
        VideoIdea,
        'sourceType' | 'videoUrl' | 'videoId' | 'thumbnailUrl' | 'titles' | 'notes'
      >
    >
  ) => Promise<void>;
  onDeleteIdea: (ideaId: string) => Promise<void>;
}

export const IdeasModule: React.FC<IdeasModuleProps> = ({
  theme,
  activeProfile,
  ideas,
  onAddIdea,
  onUpdateIdea,
  onDeleteIdea,
}) => {
  const isLight = theme === 'light';
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const filteredIdeas = ideas.filter((idea) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = idea.titles.some((t) => t.toLowerCase().includes(q));
    const matchNotes = idea.notes?.toLowerCase().includes(q);
    return matchTitle || matchNotes;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div
        className={`rounded-2xl border p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isLight ? 'bg-white border-neutral-200' : 'bg-neutral-900/50 border-neutral-800/80'
        }`}
      >
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-bold">
              Ideas de Videos ({PROFILES[activeProfile].name})
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-bold tabular-nums">
              {ideas.length} {ideas.length === 1 ? 'Idea' : 'Ideas'}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Guarda ideas para tus próximos videos combinando 1 miniatura (por URL de YouTube o imagen subida) + 4 opciones de títulos editables y notas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {ideas.length > 0 && (
            <div className="relative flex-1 sm:flex-initial sm:w-60">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en títulos o notas..."
                className={`w-full border rounded-xl pl-8 pr-8 py-2 text-xs outline-none transition-colors ${
                  isLight
                    ? 'bg-neutral-50 border-neutral-300 focus:border-neutral-500 text-neutral-900'
                    : 'bg-neutral-950 border-neutral-800 focus:border-neutral-700 text-white'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCreatorOpen((prev) => !prev)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            {isCreatorOpen ? (
              <>
                <X className="w-4 h-4" />
                <span>Cerrar creador</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Nueva Idea</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Collapsible Creator Form */}
      {isCreatorOpen && (
        <IdeaCreateForm
          theme={theme}
          nextIdeaNumber={ideas.length + 1}
          onAddIdea={onAddIdea}
          onCancel={() => setIsCreatorOpen(false)}
        />
      )}

      {/* Vertical Scrollable List of Idea Components */}
      {filteredIdeas.length === 0 ? (
        <div
          className={`py-20 text-center border border-dashed rounded-2xl space-y-3 ${
            isLight
              ? 'border-neutral-300 bg-white/60'
              : 'border-neutral-800 bg-neutral-900/20'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto text-amber-400 ${
              isLight
                ? 'bg-amber-50 border-amber-200'
                : 'bg-neutral-900 border-neutral-800'
            }`}
          >
            <Lightbulb className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">
              {searchQuery
                ? 'No se encontraron ideas con esa búsqueda'
                : `Todavía no hay ideas guardadas en ${PROFILES[activeProfile].name}`}
            </h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              {searchQuery
                ? 'Prueba con otros términos o limpia el buscador.'
                : 'Agrega tu primera idea pegando una URL de YouTube (se autocompletará el primer título) o subiendo una imagen con tus 4 variaciones de título.'}
            </p>
          </div>
          {!searchQuery && !isCreatorOpen && (
            <button
              type="button"
              onClick={() => setIsCreatorOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Primera Idea</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIdeas.map((idea, idx) => (
            <IdeaCardRow
              key={idea.id}
              idea={idea}
              index={idx}
              totalCount={filteredIdeas.length}
              theme={theme}
              onUpdateIdea={onUpdateIdea}
              onDeleteIdea={onDeleteIdea}
            />
          ))}
        </div>
      )}
    </div>
  );
};
