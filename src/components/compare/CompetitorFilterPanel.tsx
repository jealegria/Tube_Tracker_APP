import React from 'react';
import { Layers, Tag } from 'lucide-react';

interface CompetitorFilterPanelProps {
  theme: 'dark' | 'light';
  categories: string[];
  tags: string[];
  selectedCategory: string;
  selectedTags: string[];
  competitorCount: number;
  userPacksCount: number;
  onSelectCategory: (cat: string) => void;
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}

export const CompetitorFilterPanel: React.FC<CompetitorFilterPanelProps> = ({
  theme,
  categories,
  tags,
  selectedCategory,
  selectedTags,
  competitorCount,
  userPacksCount,
  onSelectCategory,
  onToggleTag,
  onClearTags,
}) => {
  const isLight = theme === 'light';

  return (
    <div
      className={`xl:col-span-5 rounded-2xl border p-5 flex flex-col justify-between space-y-4 ${
        isLight
          ? 'bg-white border-neutral-200'
          : 'bg-neutral-900/50 border-neutral-800/80'
      }`}
    >
      <div className="space-y-4">
        <div className="pb-3 border-b border-neutral-800/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold">2. Elegir Contrincantes</h2>
            <p className="text-xs text-neutral-500">
              Filtra contra qué categorías y tags de tu repositorio quieres competir.
            </p>
          </div>
          <span className="text-xs font-semibold tabular-nums text-neutral-400">
            {competitorCount} disponibles
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-red-500" />
            <span>Categoría de competidores</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onSelectCategory('Todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === 'Todas'
                  ? isLight
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'bg-white text-neutral-950 font-semibold'
                  : isLight
                  ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? isLight
                        ? 'bg-neutral-900 text-white font-semibold'
                        : 'bg-white text-neutral-950 font-semibold'
                      : isLight
                      ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      : 'bg-neutral-950 text-neutral-300 hover:bg-neutral-800 border border-neutral-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-red-500" />
              <span>Filtrar competidores por Tags</span>
            </label>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={onClearTags}
                className="text-[11px] text-neutral-500 hover:text-red-400"
              >
                Limpiar tags
              </button>
            )}
          </div>

          {tags.length === 0 ? (
            <p className="text-xs text-neutral-500">No hay tags configurados aún.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={onClearTags}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedTags.length === 0
                    ? 'bg-red-600 text-white'
                    : isLight
                    ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                }`}
              >
                Todos
              </button>
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-red-600 text-white'
                        : isLight
                        ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        : 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div
        className={`pt-3 border-t flex items-center justify-between text-xs text-neutral-500 ${
          isLight ? 'border-neutral-200' : 'border-neutral-800/70'
        }`}
      >
        <span>
          Mostrando <strong className="text-neutral-300 tabular-nums">{userPacksCount}</strong> tuyos +{' '}
          <strong className="text-neutral-300 tabular-nums">
            {Math.min(20, competitorCount)}
          </strong>{' '}
          competidores (máx. 20)
        </span>
      </div>
    </div>
  );
};
