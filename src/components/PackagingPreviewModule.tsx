import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Shuffle, Eye } from 'lucide-react';
import { PackagingItem } from '../types';
import {
  UserDraftPack,
  FeedEntry,
  fisherYatesShuffle,
  getDeterministicMeta,
} from './compare/types';
import { UserPacksUploader } from './compare/UserPacksUploader';
import { CompetitorFilterPanel } from './compare/CompetitorFilterPanel';
import { YouTubeHomeCompareView } from './compare/YouTubeHomeCompareView';

interface PackagingPreviewModuleProps {
  theme: 'dark' | 'light';
  defaultChannelName: string;
  items: PackagingItem[];
  categories: string[];
  tags: string[];
}

export const PackagingPreviewModule: React.FC<PackagingPreviewModuleProps> = ({
  theme,
  defaultChannelName,
  items,
  categories,
  tags,
}) => {
  const isLight = theme === 'light';
  const effectiveChannelName = defaultChannelName.trim() || 'Mi Canal';

  // Uploaded user draft packs
  const [userPacks, setUserPacks] = useState<UserDraftPack[]>([]);

  // Competitor filters (categories & tags)
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Highlight toggle
  const [highlightMyPacks, setHighlightMyPacks] = useState<boolean>(true);

  // Shuffled feed state
  const [shuffledFeed, setShuffledFeed] = useState<FeedEntry[]>([]);

  // Filter competitor pool based on chosen category and tags
  const competitorPool = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'Todas' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedTags.length > 0) {
        const itemTags = item.tags || [];
        const hasMatch = selectedTags.some((t) => itemTags.includes(t));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [items, selectedCategory, selectedTags]);

  // Build and shuffle the feed (up to 20 random competitors from pool + all user uploaded packs)
  const buildShuffledFeed = useCallback(() => {
    const shuffledCompetitors = fisherYatesShuffle(competitorPool).slice(0, 20);

    const repoEntries: FeedEntry[] = shuffledCompetitors.map((item) => {
      const meta = getDeterministicMeta(item.id);
      return {
        kind: 'repo',
        data: item,
        ...meta,
      };
    });

    const userEntries: FeedEntry[] = userPacks.map((pack) => ({
      kind: 'user',
      data: pack,
    }));

    const combined = fisherYatesShuffle([...userEntries, ...repoEntries]);
    setShuffledFeed(combined);
  }, [competitorPool, userPacks]);

  useEffect(() => {
    buildShuffledFeed();
  }, [buildShuffledFeed]);

  const toggleCompetitorTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Panel: Step 1 (Upload Multiple Packs) & Step 2 (Competitor Filters) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <UserPacksUploader
          theme={theme}
          channelName={defaultChannelName}
          userPacks={userPacks}
          onAddPack={(newPack) => setUserPacks((prev) => [...prev, newPack])}
          onRemovePack={(id) => setUserPacks((prev) => prev.filter((p) => p.id !== id))}
          onClearAllPacks={() => setUserPacks([])}
        />

        <CompetitorFilterPanel
          theme={theme}
          categories={categories}
          tags={tags}
          selectedCategory={selectedCategory}
          selectedTags={selectedTags}
          competitorCount={competitorPool.length}
          userPacksCount={userPacks.length}
          onSelectCategory={setSelectedCategory}
          onToggleTag={toggleCompetitorTag}
          onClearTags={() => setSelectedTags([])}
        />
      </div>

      {/* Action Bar: Highlight Toggle + Shuffle Button */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => setHighlightMyPacks((v) => !v)}
          className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
            highlightMyPacks
              ? 'bg-red-600/15 border-red-500/40 text-red-400'
              : isLight
              ? 'bg-white border-neutral-200 text-neutral-600 hover:text-neutral-900'
              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
          title="Activa o desactiva el borde indicador en tus packs para verlos camuflados al 100%"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{highlightMyPacks ? 'Borde en mis packs: ON' : 'Borde en mis packs: OFF'}</span>
        </button>

        <button
          type="button"
          onClick={buildShuffledFeed}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
          title="Rotar hasta 20 competidores del repositorio y mezclar todas las posiciones"
        >
          <Shuffle className="w-3.5 h-3.5" />
          <span>Mezclar</span>
        </button>
      </div>

      {/* YouTube Home Clone Feed */}
      <YouTubeHomeCompareView
        theme={theme}
        channelName={effectiveChannelName}
        shuffledFeed={shuffledFeed}
        highlightMyPacks={highlightMyPacks}
      />
    </div>
  );
};
