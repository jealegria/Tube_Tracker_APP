import React, { useState } from 'react';
import {
  Plus,
  X,
  Search,
  Star,
  ArrowUpDown,
  Eye,
  EyeOff,
  Type,
  SlidersHorizontal,
} from 'lucide-react';
import { CategoryFilter, SortOrder, ActiveModule } from '../types';

interface FilterToolbarProps {
  activeModule: ActiveModule;
  theme: 'dark' | 'light';
  categories: string[];
  tags: string[];
  totalCount: number;
  categoryCounts: Record<string, number>;
  tagCounts: Record<string, number>;
  activeCategory: CategoryFilter;
  activeTag: string | null;
  searchQuery: string;
  onlyFavorites: boolean;
  sortOrder: SortOrder;
  detailedView: boolean;
  showTitles: boolean;
  onSelectCategory: (cat: CategoryFilter) => void;
  onSelectTag: (tag: string | null) => void;
  onSearchChange: (q: string) => void;
  onToggleFavorites: () => void;
  onSortChange: (sort: SortOrder) => void;
  onToggleDetailedView: () => void;
  onToggleTitles: () => void;
  onCreateCategory: (name: string) => boolean;
  onDeleteCategory: (name: string) => void;
  onOpenTagManager: () => void;
  onOpenAddModal: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  theme,
  categories,
  tags,
  activeCategory,
  activeTag,
  searchQuery,
  onlyFavorites,
  sortOrder,
  detailedView,
  showTitles,
  onSelectCategory,
  onSelectTag,
  onSearchChange,
  onToggleFavorites,
  onSortChange,
  onToggleDetailedView,
  onToggleTitles,
  onCreateCategory,
  onDeleteCategory,
  onOpenTagManager,
  onOpenAddModal,
}) => {
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const isLight = theme === 'light';

  const handleCreateCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onCreateCategory(newCategoryName);
    if (ok) {
      onSelectCategory(newCategoryName.trim());
      setNewCategoryName('');
      setIsCreatingCategory(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Row 1: YouTube-style Category Filter Bar + Search & View Controls + Add Pack CTA */}
      <section
        className={`flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b ${
          isLight ? 'border-neutral-200' : 'border-neutral-800/60'
        }`}
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <button
            onClick={() => onSelectCategory('Todas')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeCategory === 'Todas'
                ? isLight
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-white text-neutral-950 font-semibold'
                : isLight
                ? 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300/80'
                : 'bg-[#272727] text-neutral-200 hover:bg-[#3f3f3f]'
            }`}
          >
            Todas
          </button>

          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <div key={cat} className="relative group/cat flex items-center shrink-0">
                <button
                  onClick={() => onSelectCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? isLight
                        ? 'bg-neutral-900 text-white font-semibold'
                        : 'bg-white text-neutral-950 font-semibold'
                      : isLight
                      ? 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300/80'
                      : 'bg-[#272727] text-neutral-200 hover:bg-[#3f3f3f]'
                  }`}
                >
                  {cat}
                </button>
                {cat !== 'Ideas' && cat !== 'Formatos' && categories.length > 1 && (
                  <button
                    onClick={() => onDeleteCategory(cat)}
                    className="ml-0.5 p-1 text-neutral-500 hover:text-red-500 opacity-0 group-hover/cat:opacity-100 transition-opacity"
                    title={`Eliminar categoría ${cat}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {isCreatingCategory ? (
            <form onSubmit={handleCreateCategorySubmit} className="flex items-center gap-1 shrink-0">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Categoría..."
                className={`border rounded-lg px-2.5 py-1 text-xs outline-none w-28 ${
                  isLight
                    ? 'bg-white border-neutral-300 text-neutral-900'
                    : 'bg-neutral-900 border-neutral-700 text-white'
                }`}
                autoFocus
              />
              <button
                type="submit"
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  isLight
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-950'
                }`}
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(false)}
                className="p-1 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingCategory(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
              title="Nueva categoría"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Categoría</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:flex-initial sm:w-56">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar..."
              className={`w-full border rounded-full pl-8 pr-8 py-1.5 text-xs placeholder:text-neutral-500 outline-none transition-colors ${
                isLight
                  ? 'bg-white border-neutral-300 focus:border-neutral-500 text-neutral-900'
                  : 'bg-[#121212] border-neutral-800 focus:border-neutral-600 text-white'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={onToggleFavorites}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              onlyFavorites
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                : isLight
                ? 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300/80'
                : 'bg-[#272727] text-neutral-300 hover:bg-[#3f3f3f]'
            }`}
            title="Mostrar solo favoritos"
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Favoritos</span>
          </button>

          <div
            className={`relative flex items-center rounded-lg px-2.5 py-1.5 text-xs transition-colors shrink-0 ${
              isLight
                ? 'bg-neutral-200/80 hover:bg-neutral-300/80 text-neutral-800'
                : 'bg-[#272727] hover:bg-[#3f3f3f] text-neutral-200'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 mr-1.5" />
            <select
              value={sortOrder}
              onChange={(e) => onSortChange(e.target.value as SortOrder)}
              className="bg-transparent outline-none text-xs cursor-pointer pr-1"
            >
              <option value="newest" className={isLight ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}>
                Más recientes
              </option>
              <option value="oldest" className={isLight ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}>
                Más antiguos
              </option>
              <option value="alpha" className={isLight ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'}>
                A - Z
              </option>
            </select>
          </div>

          {/* Toggle Mostrar Títulos (Desactivado por defecto) */}
          <button
            onClick={onToggleTitles}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              showTitles
                ? isLight
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-white text-neutral-950 font-semibold'
                : isLight
                ? 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300/80'
                : 'bg-[#272727] text-neutral-300 hover:bg-[#3f3f3f]'
            }`}
            title={showTitles ? 'Ocultar títulos y canal' : 'Mostrar títulos y canal'}
          >
            <Type className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Títulos</span>
          </button>

          {/* Toggle Mostrar Detalles */}
          <button
            onClick={onToggleDetailedView}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              detailedView
                ? isLight
                  ? 'bg-neutral-900 text-white font-semibold'
                  : 'bg-white text-neutral-950 font-semibold'
                : isLight
                ? 'bg-neutral-200/80 text-neutral-700 hover:bg-neutral-300/80'
                : 'bg-[#272727] text-neutral-300 hover:bg-[#3f3f3f]'
            }`}
            title="Alternar notas y tags en las tarjetas"
          >
            {detailedView ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Detalles</span>
          </button>

          {/* Botón Principal para Abrir Popup de Agregar Pack */}
          <button
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Pack</span>
          </button>
        </div>
      </section>

      {/* Row 2: Minimal Tag Filter Row */}
      {tags.length > 0 && (
        <section className="flex items-center justify-between gap-2 overflow-x-auto py-0.5 scrollbar-none">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectTag(null)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTag === null
                  ? isLight
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-200 text-neutral-950'
                  : isLight
                  ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
              }`}
            >
              Todos los tags
            </button>

            {tags.map((tag) => {
              const isSelected = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onSelectTag(isSelected ? null : tag)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-red-600 text-white'
                      : isLight
                      ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                  }`}
                >
                  #{tag}
                </button>
              );
            })}
          </div>

          <button
            onClick={onOpenTagManager}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md shrink-0 transition-colors ${
              isLight
                ? 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden sm:inline">Tags</span>
          </button>
        </section>
      )}
    </div>
  );
};
