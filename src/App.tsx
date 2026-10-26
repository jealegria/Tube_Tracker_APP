import React, { useState, useMemo, useEffect } from 'react';
import {
  Share2,
  X,
  Eye,
  LayoutGrid,
  Plus,
} from 'lucide-react';
import { PackagingItem, CategoryFilter, SortOrder, ActiveModule } from './types';
import { PROFILES } from './firebase';
import { useProfileWorkspace } from './hooks/useProfileWorkspace';
import { AccessGate } from './components/AccessGate';
import { Navbar } from './components/Navbar';
import { PackagingCaptureForm } from './components/PackagingCaptureForm';
import { FilterToolbar } from './components/FilterToolbar';
import { PackagingCard } from './components/PackagingCard';
import { LightboxModal } from './components/LightboxModal';
import { TagManagerModal } from './components/TagManagerModal';
import { PackagingPreviewModule } from './components/PackagingPreviewModule';
import { TestingModule } from './components/ABTestingModule';
import { DataDashboardView } from './components/DataDashboardView';
import { SettingsView } from './components/SettingsView';
import { MyVideosModule } from './components/MyVideosModule';

export function App() {
  const {
    user,
    authLoading,
    isAuthorized,
    activeProfile,
    setActiveProfile,
    ownProfile,
    packagings,
    categories,
    tags,
    defaultChannelName,
    updateDefaultChannelName,
    myVideos,
    myVideoPacks,
    createMyVideoFolder,
    renameMyVideoFolder,
    deleteMyVideoFolder,
    upsertMyVideoPack,
    removeMyVideoPack,
    sharedBannerCount,
    setSharedBannerCount,
    statusBanner,
    setStatusBanner,
    addPackaging,
    updateCategory,
    updateTags,
    updateNotes,
    updateTitle,
    toggleFavorite,
    deleteItem,
    createCategory,
    deleteCategory,
    addTag,
    editTag,
    deleteTag,
    importItems,
  } = useProfileWorkspace();

  const [activeModule, setActiveModule] = useState<ActiveModule>('repositorio');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('Todas');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [detailedView, setDetailedView] = useState(false);
  const [showTitles, setShowTitles] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('tube_stacker_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    try {
      localStorage.setItem('tube_stacker_theme', theme);
    } catch {
      // ignore storage error
    }
  }, [theme]);

  const [lightboxItem, setLightboxItem] = useState<PackagingItem | null>(null);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);

  const isLight = theme === 'light';

  const filteredPackagings = useMemo(() => {
    return packagings
      .filter((item) => {
        if (activeCategory !== 'Todas' && item.category !== activeCategory) return false;
        if (activeTag && (!item.tags || !item.tags.includes(activeTag))) return false;
        if (onlyFavorites && !item.favorite) return false;
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchChannel = item.channelTitle?.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          const matchTags = item.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchChannel && !matchNotes && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') return b.createdAt - a.createdAt;
        if (sortOrder === 'oldest') return a.createdAt - b.createdAt;
        if (sortOrder === 'alpha') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [packagings, activeCategory, activeTag, onlyFavorites, searchQuery, sortOrder]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todas: packagings.length };
    categories.forEach((c) => {
      counts[c] = 0;
    });
    packagings.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [packagings, categories]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tags.forEach((t) => {
      counts[t] = 0;
    });
    packagings.forEach((p) => {
      p.tags?.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [packagings, tags]);

  if (authLoading || !user || !isAuthorized) {
    return (
      <AccessGate
        authLoading={authLoading}
        user={user}
        isAuthorized={isAuthorized}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex transition-colors duration-200 selection:bg-red-500/30 ${
        isLight
          ? 'bg-[#f8f9fa] text-neutral-900 selection:text-red-900'
          : 'bg-[#0f0f0f] text-neutral-100 selection:text-red-200'
      }`}
    >
      <Navbar
        user={user}
        activeProfile={activeProfile}
        ownProfile={ownProfile}
        activeModule={activeModule}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onSelectProfile={(pid) => {
          setActiveProfile(pid);
          setActiveCategory('Todas');
          setActiveTag(null);
        }}
        onSelectModule={setActiveModule}
      />

      <main className="flex-1 pl-16 w-full">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {sharedBannerCount !== null && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Colección compartida cargada: <strong>{sharedBannerCount} packagings</strong>.
                </span>
              </div>
              <button
                onClick={() => setSharedBannerCount(null)}
                className="text-emerald-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {statusBanner && (
            <div
              className={`border rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs ${
                isLight
                  ? 'bg-white border-neutral-200 text-neutral-700'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-200'
              }`}
            >
              <span>{statusBanner}</span>
              <button
                onClick={() => setStatusBanner(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeProfile !== ownProfile && (
            <div
              className={`border rounded-xl px-4 py-2 flex items-center justify-between gap-3 text-xs ${
                isLight
                  ? 'bg-white border-neutral-200 text-neutral-700'
                  : 'bg-neutral-900/80 border-neutral-800 text-neutral-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>
                  Viendo el perfil de <strong>{PROFILES[activeProfile].name}</strong>
                </span>
              </div>
              <button
                onClick={() => setActiveProfile(ownProfile)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                  isLight
                    ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                }`}
              >
                Volver a {PROFILES[ownProfile].name}
              </button>
            </div>
          )}

          {activeModule === 'datos' ? (
            <DataDashboardView
              theme={theme}
              activeProfile={activeProfile}
              items={packagings}
              categories={categories}
              tags={tags}
              onImportItems={importItems}
            />
          ) : activeModule === 'settings' ? (
            <SettingsView
              theme={theme}
              activeProfile={activeProfile}
              defaultChannelName={defaultChannelName}
              onSaveDefaultChannel={updateDefaultChannelName}
            />
          ) : activeModule === 'misvideos' ? (
            <MyVideosModule
              theme={theme}
              activeProfile={activeProfile}
              defaultChannelName={defaultChannelName}
              myVideos={myVideos}
              myVideoPacks={myVideoPacks}
              onCreateVideoFolder={createMyVideoFolder}
              onRenameVideoFolder={renameMyVideoFolder}
              onDeleteVideoFolder={deleteMyVideoFolder}
              onUpsertVideoPack={upsertMyVideoPack}
              onDeleteVideoPack={removeMyVideoPack}
            />
          ) : activeModule === 'testing' ? (
            <TestingModule
              theme={theme}
              activeProfile={activeProfile}
              defaultChannelName={defaultChannelName}
              items={packagings}
              myVideos={myVideos}
              myVideoPacks={myVideoPacks}
            />
          ) : activeModule === 'preview' ? (
            <PackagingPreviewModule
              theme={theme}
              defaultChannelName={defaultChannelName}
              items={packagings}
              categories={categories}
              tags={tags}
              myVideos={myVideos}
              myVideoPacks={myVideoPacks}
            />
          ) : (
            <>
              <FilterToolbar
                activeModule={activeModule}
                theme={theme}
                categories={categories}
                tags={tags}
                totalCount={packagings.length}
                categoryCounts={categoryCounts}
                tagCounts={tagCounts}
                activeCategory={activeCategory}
                activeTag={activeTag}
                searchQuery={searchQuery}
                onlyFavorites={onlyFavorites}
                sortOrder={sortOrder}
                detailedView={detailedView}
                showTitles={showTitles}
                onSelectCategory={setActiveCategory}
                onSelectTag={setActiveTag}
                onSearchChange={setSearchQuery}
                onToggleFavorites={() => setOnlyFavorites((v) => !v)}
                onSortChange={setSortOrder}
                onToggleDetailedView={() => setDetailedView((v) => !v)}
                onToggleTitles={() => setShowTitles((v) => !v)}
                onCreateCategory={createCategory}
                onDeleteCategory={(cat) => {
                  deleteCategory(cat);
                  if (activeCategory === cat) setActiveCategory('Todas');
                }}
                onOpenTagManager={() => setIsTagManagerOpen(true)}
                onOpenAddModal={() => setIsAddModalOpen(true)}
              />

              {filteredPackagings.length === 0 ? (
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
                    <LayoutGrid className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">
                      No hay packagings en {PROFILES[activeProfile].name}
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-md mx-auto">
                      {searchQuery || onlyFavorites || activeCategory !== 'Todas' || activeTag
                        ? 'Prueba cambiando los filtros activos o limpiando la búsqueda.'
                        : 'Usa el botón Agregar Pack para guardar tu primer video.'}
                    </p>
                  </div>
                  {searchQuery || onlyFavorites || activeCategory !== 'Todas' || activeTag ? (
                    <button
                      onClick={() => {
                        setActiveCategory('Todas');
                        setActiveTag(null);
                        setOnlyFavorites(false);
                        setSearchQuery('');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                        isLight
                          ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                      }`}
                    >
                      Restablecer filtros
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-medium text-white inline-flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Pack</span>
                    </button>
                  )}
                </div>
              ) : (
                <section
                  className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 ${
                    showTitles || detailedView ? 'gap-y-8' : 'gap-y-4'
                  }`}
                >
                  {filteredPackagings.map((item) => (
                    <PackagingCard
                      key={item.id}
                      item={item}
                      theme={theme}
                      availableCategories={categories}
                      allTags={tags}
                      detailedView={detailedView}
                      showTitles={showTitles}
                      onUpdateCategory={updateCategory}
                      onUpdateTags={updateTags}
                      onUpdateNotes={updateNotes}
                      onUpdateTitle={updateTitle}
                      onToggleFavorite={toggleFavorite}
                      onDelete={deleteItem}
                      onOpenLightbox={(selected) => setLightboxItem(selected)}
                    />
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <PackagingCaptureForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        theme={theme}
        activeProfile={activeProfile}
        categories={categories}
        tags={tags}
        packagings={packagings}
        onAddPackaging={addPackaging}
        onAddTag={addTag}
        onOpenTagManager={() => setIsTagManagerOpen(true)}
      />

      <LightboxModal
        item={
          lightboxItem
            ? packagings.find((p) => p.id === lightboxItem.id) || lightboxItem
            : null
        }
        items={filteredPackagings}
        allTags={tags}
        availableCategories={categories}
        onClose={() => setLightboxItem(null)}
        onSelect={(selected) => setLightboxItem(selected)}
        onToggleFavorite={toggleFavorite}
        onUpdateCategory={updateCategory}
        onUpdateNotes={updateNotes}
        onUpdateTags={updateTags}
      />

      <TagManagerModal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        tags={tags}
        items={packagings}
        onAddTag={addTag}
        onEditTag={editTag}
        onDeleteTag={(tagName) => {
          deleteTag(tagName);
          if (activeTag === tagName) setActiveTag(null);
        }}
      />
    </div>
  );
}
export default App;
