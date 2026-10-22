import React from 'react';
import {
  Youtube,
  Search,
  Mic,
  Bell,
  Video,
  MoreVertical,
  Check,
} from 'lucide-react';
import { FeedEntry } from './types';

interface YouTubeHomeCompareViewProps {
  theme: 'dark' | 'light';
  channelName: string;
  shuffledFeed: FeedEntry[];
  highlightMyPacks: boolean;
}

export const YouTubeHomeCompareView: React.FC<YouTubeHomeCompareViewProps> = ({
  theme,
  channelName,
  shuffledFeed,
  highlightMyPacks,
}) => {
  const isLight = theme === 'light';

  return (
    <div
      className={`border rounded-2xl overflow-hidden ${
        isLight
          ? 'bg-white border-neutral-200'
          : 'bg-[#0f0f0f] border-neutral-800/80'
      }`}
    >
      {/* Simulated YouTube Top Bar */}
      <div
        className={`px-6 py-3 border-b flex items-center justify-between gap-4 ${
          isLight
            ? 'bg-white border-neutral-200'
            : 'bg-[#0f0f0f] border-neutral-800/80'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-5 rounded-md bg-[#FF0000] flex items-center justify-center text-white">
            <Youtube className="w-4 h-4 fill-white" />
          </div>
          <span
            className={`font-bold text-base tracking-tighter ${
              isLight ? 'text-neutral-900' : 'text-white'
            }`}
          >
            YouTube
          </span>
        </div>

        <div className="flex-1 max-w-xl mx-auto hidden sm:flex items-center gap-3">
          <div
            className={`flex flex-1 items-center border rounded-full overflow-hidden ${
              isLight
                ? 'bg-neutral-100 border-neutral-300'
                : 'bg-[#121212] border-[#303030]'
            }`}
          >
            <input
              type="text"
              readOnly
              placeholder="Buscar"
              className="w-full bg-transparent px-4 py-1.5 text-sm placeholder:text-neutral-500 outline-none"
            />
            <div
              className={`px-5 py-1.5 border-l text-neutral-400 ${
                isLight
                  ? 'bg-neutral-200 border-neutral-300'
                  : 'bg-[#222222] border-[#303030]'
              }`}
            >
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`p-2 rounded-full ${
              isLight
                ? 'bg-neutral-100 text-neutral-700'
                : 'bg-[#222222] text-neutral-200'
            }`}
          >
            <Mic className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center gap-3 text-neutral-400">
          <Video className="w-5 h-5 hidden sm:block" />
          <Bell className="w-5 h-5 hidden sm:block" />
          <div className="w-8 h-8 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs uppercase">
            {(channelName || 'M')[0]}
          </div>
        </div>
      </div>

      {/* Feed Grid */}
      <div className="p-6">
        {shuffledFeed.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-neutral-500">
            <p className="text-sm font-medium">
              No hay videos para mostrar con los filtros actuales.
            </p>
            <p className="text-xs">
              Sube un pack propio arriba o cambia la categoría/tags de los contrincantes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
            {shuffledFeed.map((entry) => {
              if (entry.kind === 'user') {
                const pack = entry.data;
                return (
                  <div key={pack.id} className="group relative flex flex-col cursor-pointer">
                    <div
                      className={`relative aspect-video w-full bg-[#18181b] rounded-xl overflow-hidden transition-all ${
                        highlightMyPacks
                          ? 'ring-2 ring-red-500 shadow-lg shadow-red-950/30'
                          : ''
                      }`}
                    >
                      <img
                        src={pack.thumbnailUrl}
                        alt={pack.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      {highlightMyPacks && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide shadow">
                          Tu Pack
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[11px] font-semibold tabular-nums">
                        {pack.duration}
                      </div>
                    </div>

                    <div className="pt-3 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-xs shrink-0 uppercase">
                        {(channelName || 'M').trim().charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0 pr-1">
                        <h3
                          className={`text-[14px] leading-[20px] font-medium line-clamp-2 ${
                            isLight
                              ? 'text-neutral-900 group-hover:text-black'
                              : 'text-[#f1f1f1] group-hover:text-white'
                          }`}
                        >
                          {pack.title}
                        </h3>
                        <div
                          className={`text-[12px] mt-1 leading-tight flex items-center gap-1 truncate ${
                            isLight ? 'text-neutral-600' : 'text-[#aaaaaa]'
                          }`}
                        >
                          <span className="truncate">{channelName || 'Mi Canal'}</span>
                          <Check className="w-3 h-3 text-neutral-400 shrink-0" />
                          <span className="shrink-0">
                            · {pack.viewsLabel} · {pack.timeAgoLabel}
                          </span>
                        </div>
                      </div>
                      <button className="text-neutral-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              }

              const item = entry.data;
              return (
                <div key={item.id} className="group relative flex flex-col cursor-pointer">
                  <div className="relative aspect-video w-full bg-[#18181b] rounded-xl overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
                      }}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[11px] font-semibold tabular-nums">
                      {entry.duration}
                    </div>
                  </div>

                  <div className="pt-3 flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-full border font-bold flex items-center justify-center text-xs shrink-0 uppercase ${
                        isLight
                          ? 'bg-neutral-200 border-neutral-300 text-neutral-800'
                          : 'bg-neutral-800 border-white/5 text-neutral-200'
                      }`}
                    >
                      {item.channelTitle?.charAt(0) || 'Y'}
                    </div>
                    <div className="flex-1 min-w-0 pr-1">
                      <h3
                        className={`text-[14px] leading-[20px] font-medium line-clamp-2 ${
                          isLight
                            ? 'text-neutral-900 group-hover:text-black'
                            : 'text-[#f1f1f1] group-hover:text-white'
                        }`}
                      >
                        {item.title}
                      </h3>
                      <div
                        className={`text-[12px] mt-1 leading-tight flex items-center gap-1 truncate ${
                          isLight ? 'text-neutral-600' : 'text-[#aaaaaa]'
                        }`}
                      >
                        <span className="truncate">{item.channelTitle || 'Canal'}</span>
                        <Check className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="shrink-0">
                          · {entry.viewsLabel} · {entry.timeAgoLabel}
                        </span>
                      </div>
                    </div>
                    <button className="text-neutral-400 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
