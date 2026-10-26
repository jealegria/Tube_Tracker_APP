import React from 'react';
import {
  Youtube,
  Search,
  Mic,
  Bell,
  Video,
  MoreVertical,
  Check,
  Home,
  Compass,
  PlaySquare,
  User,
  ThumbsUp,
  Share2,
  Play,
  Volume2,
  Settings,
  Maximize,
  Shuffle,
} from 'lucide-react';
import { PackagingItem } from '../../types';
import {
  ABTestVariation,
  ABPlacementMode,
  ABDeviceType,
  ABPreviewTheme,
} from './types';
import { getDeterministicMeta } from '../compare/types';

interface YouTubeDeviceSimulatorProps {
  activeVariation: ABTestVariation | null;
  channelName: string;
  surroundingItems: PackagingItem[];
  userPositionIndex: number;
  placement: ABPlacementMode;
  device: ABDeviceType;
  previewTheme: ABPreviewTheme;
}

type SimCard = {
  isUser: boolean;
  id: string;
  title: string;
  channel: string;
  thumbUrl: string;
  fallbackThumbUrl?: string;
  duration: string;
  views: string;
  timeAgo: string;
  label?: string;
};

export const YouTubeDeviceSimulator: React.FC<YouTubeDeviceSimulatorProps> = ({
  activeVariation,
  channelName,
  surroundingItems,
  userPositionIndex,
  placement,
  device,
  previewTheme,
}) => {
  const isBright = previewTheme === 'light';
  const effectiveChannel = channelName.trim() || 'Mi Canal';

  // Separate the currently playing video (last item in surroundingItems) from the recommended feed cards
  // so the video being watched never repeats in the suggested list below/beside the user's variation
  const { cards, playingCard } = React.useMemo(() => {
    const timeLabels = ['8mo ago', '1mo ago', '2w ago', '1y ago', '3d ago', '5mo ago', '10d ago'];
    const compactViews = ['104K', '7K', '42K', '218K', '89K', '15K', '310K'];

    const allRepoCards: SimCard[] = surroundingItems.map((item, idx) => {
      const meta = getDeterministicMeta(item.id);
      return {
        isUser: false,
        id: item.id,
        title: item.title,
        channel: item.channelTitle || 'Indie Game Clinic',
        thumbUrl: `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`,
        fallbackThumbUrl: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
        duration: meta.duration,
        views: compactViews[idx % compactViews.length],
        timeAgo: timeLabels[idx % timeLabels.length],
      };
    });

    // Reserve the last item exclusively for the active video player so it never duplicates in the feed
    const dedicatedPlayingCard: SimCard =
      allRepoCards.length > 0
        ? allRepoCards[allRepoCards.length - 1]
        : {
            isUser: false,
            id: 'playing-fallback',
            title: 'Video en reproducción actual',
            channel: 'Game-Oracle',
            thumbUrl: activeVariation?.thumbnailUrl || '',
            duration: '18:42',
            views: '263 K',
            timeAgo: 'hace 3 m',
          };

    const repoCards =
      allRepoCards.length > 1 ? allRepoCards.slice(0, -1) : allRepoCards;

    if (!activeVariation) {
      return { cards: repoCards, playingCard: dedicatedPlayingCard };
    }

    const userCard: SimCard = {
      isUser: true,
      id: activeVariation.id,
      title: activeVariation.title,
      channel: effectiveChannel,
      thumbUrl: activeVariation.thumbnailUrl,
      duration: '15:13',
      views: '104K',
      timeAgo: '2h ago',
      label: activeVariation.label,
    };

    // Maximum allowed index per device & placement so the user's pack is 100% guaranteed to appear in the visible feed
    const maxAllowedIndexMap: Record<ABDeviceType, Record<ABPlacementMode, number>> = {
      pc: { home: 5, sidebar: 3, fullscreen: 1 },
      mobile: { home: 1, sidebar: 0, fullscreen: 1 },
      tablet: { home: 3, sidebar: 2, fullscreen: 1 },
      tv: { home: 1, sidebar: 2, fullscreen: 1 },
    };

    const maxAllowed = maxAllowedIndexMap[device][placement];
    const safePosition = Math.min(Math.max(0, userPositionIndex), maxAllowed);
    const insertIdx = Math.min(safePosition, repoCards.length);
    const result = [...repoCards];
    result.splice(insertIdx, 0, userCard);
    return { cards: result, playingCard: dedicatedPlayingCard };
  }, [activeVariation, surroundingItems, effectiveChannel, userPositionIndex, device, placement]);

  // Horizontal drag-to-scroll state for Mobile Fullscreen ("Más videos")
  const fullscreenCarouselRef = React.useRef<HTMLDivElement>(null);
  const [isDraggingCarousel, setIsDraggingCarousel] = React.useState(false);
  const dragStartXRef = React.useRef(0);
  const dragScrollLeftRef = React.useRef(0);

  const handleCarouselMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fullscreenCarouselRef.current) return;
    setIsDraggingCarousel(true);
    dragStartXRef.current = e.pageX - fullscreenCarouselRef.current.offsetLeft;
    dragScrollLeftRef.current = fullscreenCarouselRef.current.scrollLeft;
  };

  const handleCarouselMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingCarousel || !fullscreenCarouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - fullscreenCarouselRef.current.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1.3;
    fullscreenCarouselRef.current.scrollLeft = dragScrollLeftRef.current - walk;
  };

  const stopCarouselDragging = () => {
    setIsDraggingCarousel(false);
  };

  // Reset horizontal scroll position to 0 when switching variations or shuffling
  React.useEffect(() => {
    if (fullscreenCarouselRef.current) {
      fullscreenCarouselRef.current.scrollLeft = 0;
    }
  }, [activeVariation?.id, surroundingItems, placement, device]);

  // Colors matching exact YouTube 2026 Dark (#0f0f0f) and Light (#ffffff) tokens
  const ytBg = isBright ? 'bg-[#ffffff] text-[#0f0f0f]' : 'bg-[#0f0f0f] text-[#f1f1f1]';
  const ytBorder = isBright ? 'border-[#e5e5e5]' : 'border-[#272727]';
  const ytTitleColor = isBright ? 'text-[#0f0f0f]' : 'text-[#f1f1f1]';
  const ytMetaColor = isBright ? 'text-[#606060]' : 'text-[#aaaaaa]';
  const ytChipActive = isBright ? 'bg-[#0f0f0f] text-[#ffffff]' : 'bg-[#f1f1f1] text-[#0f0f0f]';
  const ytChipIdle = isBright
    ? 'bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]'
    : 'bg-[#272727] text-[#f1f1f1] hover:bg-[#3f3f3f]';

  const renderThumbImg = (card: SimCard, className = 'w-full h-full object-cover') => (
    <img
      src={card.thumbUrl}
      alt={card.title}
      referrerPolicy="no-referrer"
      onError={(e) => {
        if (card.fallbackThumbUrl) {
          (e.target as HTMLImageElement).src = card.fallbackThumbUrl;
        }
      }}
      className={className}
    />
  );

  // ============================================================================
  // 1. PC (Desktop YouTube Web - Exact 2026 Layout)
  // ============================================================================
  if (device === 'pc') {
    return (
      <div className={`rounded-2xl border overflow-hidden shadow-2xl ${ytBg} ${ytBorder}`}>
        {/* Official YouTube Web Masthead (56px height) */}
        <div className="h-14 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1 cursor-pointer p-1">
              <span className={`w-4 h-[1.5px] ${isBright ? 'bg-[#0f0f0f]' : 'bg-[#f1f1f1]'}`} />
              <span className={`w-4 h-[1.5px] ${isBright ? 'bg-[#0f0f0f]' : 'bg-[#f1f1f1]'}`} />
              <span className={`w-4 h-[1.5px] ${isBright ? 'bg-[#0f0f0f]' : 'bg-[#f1f1f1]'}`} />
            </div>
            <div className="flex items-center gap-1">
              <div className="w-7 h-5 rounded-[5px] bg-[#FF0000] flex items-center justify-center text-white">
                <Youtube className="w-4 h-4 fill-white" />
              </div>
              <span className="font-bold text-[18px] tracking-tighter">Premium</span>
              <span className={`text-[10px] self-start mt-0.5 ml-0.5 font-medium ${ytMetaColor}`}>
                AR
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-[600px] mx-auto flex items-center gap-3">
            <div
              className={`flex flex-1 items-center border rounded-full overflow-hidden h-10 ${
                isBright ? 'bg-white border-[#ccc]' : 'bg-[#121212] border-[#303030]'
              }`}
            >
              <input
                type="text"
                readOnly
                placeholder="Search"
                className="w-full bg-transparent px-4 text-[16px] placeholder:text-neutral-500 outline-none"
              />
              <div
                className={`w-16 h-full flex items-center justify-center border-l ${
                  isBright
                    ? 'bg-[#f8f8f8] border-[#ccc] text-[#0f0f0f]'
                    : 'bg-[#222222] border-[#303030] text-[#f1f1f1]'
                }`}
              >
                <Search className="w-5 h-5" />
              </div>
            </div>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isBright ? 'bg-[#f2f2f2]' : 'bg-[#272727]'
              }`}
            >
              <Mic className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3.5 py-1.5 rounded-full text-[14px] font-medium flex items-center gap-1.5 ${
                isBright ? 'bg-[#f2f2f2]' : 'bg-[#272727]'
              }`}
            >
              <span className="text-lg leading-none font-light">+</span>
              <span>Create</span>
            </div>
            <Bell className="w-5 h-5 mx-1" />
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-semibold flex items-center justify-center text-sm uppercase">
              {effectiveChannel.charAt(0)}
            </div>
          </div>
        </div>

        {placement === 'home' ? (
          /* PC HOME PAGE FEED (3 Columns, 360x202 ref, 16px Roboto Medium title, 2-line clamp) */
          <div className="px-6 pb-6 pt-2 space-y-6">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
              {['All', 'Gaming', 'Live', 'Mixes', 'Podcasts', 'Recently uploaded'].map(
                (chip, i) => (
                  <span
                    key={chip}
                    className={`px-3 py-1.5 rounded-[8px] text-[14px] font-medium whitespace-nowrap ${
                      i === 0 ? ytChipActive : ytChipIdle
                    }`}
                  >
                    {chip}
                  </span>
                )
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10">
              {cards.slice(0, 9).map((card) => (
                <div key={card.id} className="group flex flex-col cursor-pointer">
                  <div className="relative aspect-video w-full rounded-[12px] overflow-hidden bg-neutral-900">
                    {renderThumbImg(card)}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[5px] bg-black/80 text-white text-[12px] leading-[16px] font-semibold tabular-nums">
                      {card.duration}
                    </div>
                  </div>

                  <div className="mt-3 flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase ${
                        card.isUser
                          ? 'bg-red-600 text-white'
                          : isBright
                          ? 'bg-neutral-200 text-neutral-800'
                          : 'bg-neutral-800 text-neutral-200'
                      }`}
                    >
                      {card.channel.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <h3
                        className={`text-[16px] leading-[22px] font-semibold line-clamp-2 break-words ${ytTitleColor}`}
                        style={{ maxWidth: '35ch' }}
                      >
                        {card.title}
                      </h3>
                      <div className={`text-[14px] leading-[20px] mt-1 ${ytMetaColor}`}>
                        <div className="flex items-center gap-1 truncate">
                          <span className="truncate">{card.channel}</span>
                        </div>
                        <div className="truncate">
                          {card.views} views · {card.timeAgo}
                        </div>
                      </div>
                    </div>

                    <MoreVertical className={`w-5 h-5 shrink-0 opacity-0 group-hover:opacity-100 ${ytMetaColor}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* PC WATCH PAGE + RIGHT SIDEBAR (Exact 1:1 match to screenshot: Large 246x138 rounded-12px thumb + narrow ~20ch title column) */
          <div className="px-6 pb-8 pt-2 flex flex-col xl:flex-row items-start gap-6 max-w-[1600px] mx-auto">
            {/* Left Primary Video Player Column */}
            <div className="flex-1 w-full min-w-0 space-y-3">
              <div className="relative aspect-video w-full rounded-[12px] overflow-hidden bg-neutral-900 flex flex-col justify-between">
                {playingCard.thumbUrl && (
                  <img
                    src={playingCard.thumbUrl}
                    alt="Reproductor"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <h1 className={`text-[20px] leading-[28px] font-bold pt-1 ${ytTitleColor}`}>
                {playingCard.title}
              </h1>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-sm uppercase">
                    {playingCard.channel.charAt(0)}
                  </div>
                  <div>
                    <div className={`text-[16px] font-semibold leading-tight ${ytTitleColor}`}>
                      {playingCard.channel}
                    </div>
                    <div className={`text-[12px] ${ytMetaColor}`}>48.2K subscribers</div>
                  </div>
                  <button
                    className={`ml-3 px-4 py-2 rounded-full text-[14px] font-semibold ${ytChipActive}`}
                  >
                    Subscribe
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`px-4 py-2 rounded-full text-[14px] font-medium flex items-center gap-2 ${ytChipIdle}`}>
                    <ThumbsUp className="w-4 h-4" />
                    <span>4.8K</span>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-[14px] font-medium flex items-center gap-2 ${ytChipIdle}`}>
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Watch Next Column (Exact 406px width: 246x138px thumb + ~148px text column) */}
            <div className="w-full xl:w-[406px] shrink-0 space-y-3">
              {/* Filter Chips Row */}
              <div className="flex items-center justify-between gap-2 pb-0.5">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                  {['All', 'From the series', `From ${effectiveChannel}`, 'Videos'].map((chip, i) => (
                    <span
                      key={chip}
                      className={`px-3 py-1.5 rounded-[8px] text-[14px] font-medium whitespace-nowrap ${
                        i === 0 ? ytChipActive : ytChipIdle
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <span className={`text-lg pl-1 shrink-0 ${ytTitleColor}`}>&rsaquo;</span>
              </div>

              {/* Sidebar Video Rows */}
              <div className="space-y-3">
                {cards.slice(0, 6).map((card) => (
                  <div key={card.id} className="group flex items-start gap-2.5 cursor-pointer">
                    {/* Large 246x138px (16:9, ~61% of sidebar width) Thumbnail with 12px border radius */}
                    <div className="relative w-[246px] h-[138px] rounded-[12px] overflow-hidden bg-neutral-900 shrink-0">
                      {renderThumbImg(card)}
                      <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-[5px] bg-black/80 text-white text-[12px] leading-[16px] font-semibold tabular-nums">
                        {card.duration}
                      </div>
                    </div>

                    {/* Narrow Right Text Column (~148px wide -> ~19-21 chars per line, 2 lines max) */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h4
                        className={`text-[14px] leading-[20px] font-semibold line-clamp-2 break-words ${ytTitleColor}`}
                      >
                        {card.title}
                      </h4>

                      <div className={`text-[12px] leading-[18px] mt-1 ${ytMetaColor}`}>
                        <div className="truncate">{card.channel}</div>
                        <div className="flex items-center gap-1.5 truncate mt-0.5">
                          <span className="inline-flex items-center gap-1">
                            <svg
                              viewBox="0 0 16 16"
                              className="w-3 h-3 fill-none stroke-current stroke-[1.5] shrink-0"
                            >
                              <polygon points="4,2.5 13,8 4,13.5" />
                            </svg>
                            <span>{card.views}</span>
                          </span>
                          <span>{card.timeAgo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // 2. MOBILE (Official YouTube App · 390px Viewport)
  // ============================================================================
  if (device === 'mobile') {
    const sampleComments = [
      {
        count: '615',
        text: 'My greatest fiction with gamedev is my absolute lack of art skills....',
        authorInitial: 'M',
      },
      {
        count: '428',
        text: 'The retention curve breakdown at 04:12 completely changed how I package my videos.',
        authorInitial: 'A',
      },
      {
        count: '1.2K',
        text: 'This should be mandatory watching before anyone spends 2 years building a game.',
        authorInitial: 'R',
      },
    ];
    const activeComment =
      sampleComments[
        (surroundingItems[0]?.title.length || 0) % sampleComments.length
      ];

    if (placement === 'fullscreen') {
      const fullscreenChips = [
        'Todos',
        'Contenido de la serie',
        `De ${effectiveChannel}`,
        'Desarrollo de videojuegos',
        'Estrategias',
        'Videos',
      ];

      return (
        <div className="flex flex-col items-center py-2 space-y-2">
          {/* Horizontal Smartphone Frame (840px wide -> 2 full 338px cards + 2/10 of 3rd card) */}
          <div className="w-[840px] max-w-full rounded-[38px] border-[6px] border-neutral-800 bg-black text-white overflow-hidden shadow-2xl select-none">
            {/* Top Bar: "Más videos" + "X" */}
            <div className="pt-5 pb-3 pl-14 pr-7 flex items-center justify-between">
              <span className="text-[15px] font-medium tracking-tight text-white">
                Más videos
              </span>
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 stroke-white stroke-[2] fill-none cursor-pointer opacity-90 hover:opacity-100"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </div>

            {/* Filter Chips Row */}
            <div className="pl-14 pr-4 pb-3.5 flex items-center gap-2.5 overflow-x-auto scrollbar-none">
              {fullscreenChips.map((chip, i) => (
                <span
                  key={chip}
                  className={`px-3.5 py-1.5 rounded-[8px] text-[13px] font-semibold whitespace-nowrap ${
                    i === 0
                      ? 'bg-white text-black'
                      : 'bg-[#222222] text-white/95'
                  }`}
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Horizontal Draggable Video Cards Row: 2 full cards (338px each) + ~2/10 (68px) of 3rd card visible */}
            <div
              ref={fullscreenCarouselRef}
              onMouseDown={handleCarouselMouseDown}
              onMouseMove={handleCarouselMouseMove}
              onMouseUp={stopCarouselDragging}
              onMouseLeave={stopCarouselDragging}
              className={`pl-14 pr-8 pb-6 flex items-start gap-[14px] overflow-x-auto scrollbar-none ${
                isDraggingCarousel ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {cards.slice(0, 8).map((card) => (
                <div
                  key={card.id}
                  className="w-[338px] shrink-0 flex flex-col select-none"
                >
                  {/* 16:9 Thumbnail with rounded-12px corners */}
                  <div className="relative aspect-video w-full rounded-[12px] overflow-hidden bg-neutral-900">
                    <img
                      src={card.thumbUrl}
                      alt={card.title}
                      draggable={false}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (card.fallbackThumbUrl) {
                          (e.target as HTMLImageElement).src = card.fallbackThumbUrl;
                        }
                      }}
                      className="w-full h-full object-cover pointer-events-none select-none"
                    />
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[5px] bg-black/85 text-white text-[12px] leading-[16px] font-semibold tabular-nums">
                      {card.duration}
                    </div>
                  </div>

                  {/* Metadata Row below Thumbnail (Avatar + 1-line truncated Title + Channel/Views/Time + Horizontal 3-dots) */}
                  <div className="mt-2.5 flex items-center gap-3 px-0.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase ${
                        card.isUser
                          ? 'bg-red-600 text-white'
                          : 'bg-neutral-800 text-neutral-200'
                      }`}
                    >
                      {card.channel.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] leading-[19px] font-medium text-white truncate">
                        {card.title}
                      </h3>
                      <div className="text-[12px] leading-[16px] text-[#aaaaaa] truncate mt-0.5 flex items-center gap-2.5">
                        <span className="truncate">{card.channel}</span>
                        <span className="shrink-0 tabular-nums">{card.views}</span>
                        <span className="shrink-0">{card.timeAgo}</span>
                      </div>
                    </div>

                    {/* Horizontal 3-dots icon */}
                    <svg
                      viewBox="0 0 24 24"
                      className="w-4 h-4 shrink-0 fill-white"
                    >
                      <circle cx="5" cy="12" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="19" cy="12" r="1.8" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <span className="text-[11px] text-neutral-500">
            Mantén presionado el clic izquierdo y arrastra horizontalmente para deslizar los videos sugeridos
          </span>
        </div>
      );
    }

    return (
      <div className="flex justify-center py-2">
        <div
          className={`w-[390px] max-w-full rounded-[38px] border-[6px] border-neutral-800 overflow-hidden shadow-2xl flex flex-col ${ytBg}`}
        >
          {/* Mobile System Status Bar (12:11 · 5G · Battery 52) */}
          <div
            className={`h-8 px-5 flex items-center justify-between text-[12px] font-semibold select-none ${
              placement === 'sidebar'
                ? 'bg-[#1a1a1a] text-white'
                : isBright
                ? 'bg-white text-[#0f0f0f]'
                : 'bg-[#0f0f0f] text-[#f1f1f1]'
            }`}
          >
            <span className="tracking-tight">12:11</span>
            <div className="flex items-center gap-1.5">
              {/* Mute / Vibrate bell slash */}
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-current opacity-90">
                <path d="M8 2a4 4 0 0 0-4 4v2.6L2.7 9.9A1 1 0 0 0 3.4 11.5h9.2a1 1 0 0 0 .7-1.6L12 8.6V6a4 4 0 0 0-4-4zm0 12a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2z" />
              </svg>
              <span className="text-[10px] font-bold leading-none border border-current px-0.5 rounded-[2px]">
                5G
              </span>
              {/* Signal bars */}
              <div className="flex items-end gap-[1.5px] h-3">
                <span className="w-[2px] h-1.5 bg-current rounded-full" />
                <span className="w-[2px] h-2 bg-current rounded-full" />
                <span className="w-[2px] h-2.5 bg-current rounded-full" />
                <span className="w-[2px] h-3 bg-current opacity-40 rounded-full" />
              </div>
              {/* Battery pill with 52 */}
              <span className="ml-0.5 px-1.5 py-[1px] rounded-full bg-current/20 text-[10px] font-bold tabular-nums">
                52
              </span>
            </div>
          </div>

          {placement === 'home' ? (
            /* MOBILE HOME FEED */
            <>
              {/* Mobile App Header */}
              <div className={`h-11 px-3.5 border-b flex items-center justify-between ${ytBorder}`}>
                <div className="flex items-center gap-1">
                  <div className="w-6 h-4 rounded-[4px] bg-[#FF0000] flex items-center justify-center text-white">
                    <Youtube className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <span className="font-bold text-[16px] tracking-tighter">YouTube</span>
                </div>
                <div className="flex items-center gap-4">
                  <Bell className="w-5 h-5" />
                  <Search className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-4 pb-4">
                <div className="px-3 pt-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
                  {['Todos', 'Novedades', 'Gaming', 'Podcasts'].map((chip, i) => (
                    <span
                      key={chip}
                      className={`px-3 py-1 rounded-[8px] text-[13px] font-medium whitespace-nowrap ${
                        i === 0 ? ytChipActive : ytChipIdle
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                {cards.slice(0, 4).map((card) => (
                  <div key={card.id} className="space-y-2.5">
                    <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                      {renderThumbImg(card)}
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[4px] bg-black/80 text-white text-[11px] font-medium tabular-nums">
                        {card.duration}
                      </div>
                    </div>

                    <div className="px-3 flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase ${
                          card.isUser
                            ? 'bg-red-600 text-white'
                            : isBright
                            ? 'bg-neutral-200 text-neutral-800'
                            : 'bg-neutral-800 text-neutral-200'
                        }`}
                      >
                        {card.channel.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-[14px] leading-[18px] font-medium line-clamp-2 ${ytTitleColor}`}
                          style={{ maxWidth: '32ch' }}
                        >
                          {card.title}
                        </h3>
                        <div className={`text-[12px] leading-[16px] mt-1 truncate ${ytMetaColor}`}>
                          {card.channel} · {card.views} · {card.timeAgo}
                        </div>
                      </div>
                      <MoreVertical className={`w-4 h-4 shrink-0 ${ytMetaColor}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Bottom Tab Bar */}
              <div className={`h-12 border-t grid grid-cols-4 items-center text-[10px] ${ytBorder}`}>
                <div className="flex flex-col items-center gap-0.5">
                  <Home className="w-4 h-4" />
                  <span>Principal</span>
                </div>
                <div className={`flex flex-col items-center gap-0.5 ${ytMetaColor}`}>
                  <Compass className="w-4 h-4" />
                  <span>Shorts</span>
                </div>
                <div className={`flex flex-col items-center gap-0.5 ${ytMetaColor}`}>
                  <PlaySquare className="w-4 h-4" />
                  <span>Suscripciones</span>
                </div>
                <div className={`flex flex-col items-center gap-0.5 ${ytMetaColor}`}>
                  <User className="w-4 h-4" />
                  <span>Tú</span>
                </div>
              </div>
            </>
          ) : (
            /* MOBILE WATCH PAGE ("Sidebar" / Viendo un video - Exact 1:1 match to attached screenshot) */
            <div className="flex flex-col">
              {/* 1. Edge-to-Edge Video Player at Top */}
              <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                {playingCard.thumbUrl && (
                  <img
                    src={playingCard.thumbUrl}
                    alt={playingCard.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* 2. Watch Metadata Header + Actions + Comentarios Box */}
              <div
                className={`px-3 pt-3 pb-3 space-y-2.5 ${
                  isBright
                    ? 'bg-gradient-to-b from-neutral-100 to-white'
                    : 'bg-gradient-to-b from-[#1f1f1f] via-[#121212] to-[#0f0f0f]'
                }`}
              >
                {/* Video Title (1-line truncated with right fade like mobile watch sheet) */}
                <h2
                  className={`text-[17px] leading-[22px] font-bold truncate ${ytTitleColor}`}
                >
                  {playingCard.title}
                </h2>

                {/* Compact @Handle + Likes + Views + Time + ...más */}
                <div className="flex items-center justify-between text-[11.5px] leading-[16px] whitespace-nowrap overflow-hidden">
                  <div className="truncate">
                    <span className={`font-medium ${ytTitleColor}`}>
                      @{playingCard.channel.replace(/\s+/g, '-')}
                    </span>
                    <span className={`ml-1.5 ${ytMetaColor}`}>
                      8.8 K &ldquo;Me gusta&rdquo;  {playingCard.views} vistas  {playingCard.timeAgo}
                    </span>
                  </div>
                  <span className={`pl-1 font-semibold shrink-0 ${ytTitleColor}`}>más</span>
                </div>

                {/* Channel Avatar + Suscribirse Pill + Bare Action Icons (Like, Dislike, Share, Sparkle, More) */}
                <div className="flex items-center justify-between pt-0.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-200 flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                      {playingCard.channel.charAt(0)}
                    </div>
                    <button
                      type="button"
                      className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold leading-none ${ytChipActive}`}
                    >
                      Suscribirse
                    </button>
                  </div>

                  {/* Bare Action Icons on the right matching screenshot */}
                  <div className={`flex items-center gap-4 pr-1 ${ytTitleColor}`}>
                    {/* Like */}
                    <ThumbsUp className="w-[18px] h-[18px] stroke-[1.8]" />
                    {/* Dislike */}
                    <ThumbsUp className="w-[18px] h-[18px] stroke-[1.8] rotate-180" />
                    {/* Share arrow */}
                    <Share2 className="w-[18px] h-[18px] stroke-[1.8]" />
                    {/* 4-point Gemini / AI Sparkle star */}
                    <svg
                      viewBox="0 0 24 24"
                      className="w-[18px] h-[18px] fill-current"
                    >
                      <path d="M12 2C12.4 7.2 16.8 11.6 22 12C16.8 12.4 12.4 16.8 12 22C11.6 16.8 7.2 12.4 2 12C7.2 11.6 11.6 7.2 12 2Z" />
                    </svg>
                    {/* Horizontal 3 dots */}
                    <svg
                      viewBox="0 0 24 24"
                      className="w-[18px] h-[18px] fill-current"
                    >
                      <circle cx="5" cy="12" r="1.8" />
                      <circle cx="12" cy="12" r="1.8" />
                      <circle cx="19" cy="12" r="1.8" />
                    </svg>
                  </div>
                </div>

                {/* Comentarios Teaser Card (Noise between player and first recommended video) */}
                <div
                  className={`mt-1 rounded-[12px] p-3 ${
                    isBright ? 'bg-[#f2f2f2]' : 'bg-[#212121]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-[13px] font-semibold ${ytTitleColor}`}>
                        Comentarios
                      </span>
                      <span className={`text-[12px] ${ytMetaColor}`}>
                        {activeComment.count}
                      </span>
                    </div>
                    {/* Carousel indicator pill + dot */}
                    <div className="flex items-center gap-1">
                      <span
                        className={`w-3 h-1.5 rounded-full ${
                          isBright ? 'bg-neutral-800' : 'bg-white'
                        }`}
                      />
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isBright ? 'bg-neutral-400' : 'bg-white/35'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-amber-900/60 text-amber-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {activeComment.authorInitial}
                    </div>
                    <p
                      className={`text-[12px] leading-[16px] line-clamp-2 ${
                        isBright ? 'text-[#0f0f0f]' : 'text-[#e5e5e5]'
                      }`}
                    >
                      {activeComment.text}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Up Next Recommended Videos Feed (First full card + next card peeking at bottom) */}
              <div className="space-y-3">
                {cards.slice(0, 2).map((card, index) => {
                  // First card is fully shown; second card peeks at the bottom like "Feels Like Cheating" in screenshot
                  if (index === 1) {
                    return (
                      <div key={card.id} className="relative h-[86px] w-full bg-neutral-900 overflow-hidden">
                        {renderThumbImg(card, 'w-full h-[219px] object-cover object-top')}
                        {/* Android Bottom Gesture Overlay Bar */}
                        <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-16 text-white/80 pointer-events-none">
                          <span className="w-3 h-3 border-l-2 border-b-2 border-white/70 rotate-45" />
                          <span className="w-3.5 h-3.5 rounded-[4px] border-2 border-white/70" />
                          <span className="w-3 h-3 border-l-2 border-b-2 border-white/70 rotate-45 opacity-0" />
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={card.id} className="space-y-2.5 pb-1">
                      {/* Full-bleed 16:9 thumbnail */}
                      <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                        {renderThumbImg(card)}
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[4px] bg-black/80 text-white text-[11px] font-semibold tabular-nums">
                          {card.duration}
                        </div>
                      </div>

                      {/* Metadata row below thumbnail (Avatar + Bold Title + Play-icon Views + Horizontal 3-dots) */}
                      <div className="px-3 flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase ${
                            card.isUser
                              ? 'bg-red-600 text-white'
                              : isBright
                              ? 'bg-neutral-200 text-neutral-800'
                              : 'bg-neutral-800 text-neutral-200'
                          }`}
                        >
                          {card.channel.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-[15px] leading-[20px] font-semibold line-clamp-2 ${ytTitleColor}`}
                            style={{ maxWidth: '31ch' }}
                          >
                            {card.title}
                          </h3>
                          <div
                            className={`text-[12px] leading-[16px] mt-0.5 flex items-center gap-2 truncate ${ytMetaColor}`}
                          >
                            <span className="truncate">{card.channel}</span>
                            <span className="inline-flex items-center gap-0.5 shrink-0">
                              <svg
                                viewBox="0 0 16 16"
                                className="w-3 h-3 fill-none stroke-current stroke-[1.5]"
                              >
                                <polygon points="4,2.5 13,8 4,13.5" />
                              </svg>
                              <span>{card.views}</span>
                            </span>
                            <span className="shrink-0">hace 1 día</span>
                          </div>
                        </div>

                        {/* Horizontal 3-dots menu on right like screenshot */}
                        <svg
                          viewBox="0 0 24 24"
                          className={`w-4 h-4 shrink-0 mt-1 fill-current ${ytTitleColor}`}
                        >
                          <circle cx="5" cy="12" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="19" cy="12" r="1.8" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. TABLET (iPadOS / Android Tablet · 2-Column Home & Split Watch View)
  // ============================================================================
  if (device === 'tablet') {
    return (
      <div className="flex justify-center py-1">
        <div
          className={`w-[860px] max-w-full rounded-[28px] border-[6px] border-neutral-800 overflow-hidden shadow-2xl ${ytBg}`}
        >
          {/* Tablet Header */}
          <div className={`h-13 px-5 border-b flex items-center justify-between gap-4 ${ytBorder}`}>
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-5 rounded-[5px] bg-[#FF0000] flex items-center justify-center text-white">
                <Youtube className="w-4 h-4 fill-white" />
              </div>
              <span className="font-bold text-[17px] tracking-tighter">YouTube</span>
            </div>

            <div
              className={`flex-1 max-w-sm border rounded-full px-4 py-1.5 text-xs flex items-center justify-between ${
                isBright ? 'bg-neutral-100 border-neutral-300' : 'bg-[#181818] border-[#303030]'
              }`}
            >
              <span className={ytMetaColor}>Buscar en YouTube</span>
              <Search className="w-4 h-4" />
            </div>

            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <div className="w-7 h-7 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center uppercase">
                {effectiveChannel.charAt(0)}
              </div>
            </div>
          </div>

          {placement === 'home' ? (
            /* TABLET 2-COLUMN HOME FEED */
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-7">
              {cards.slice(0, 6).map((card) => (
                <div key={card.id} className="flex flex-col">
                  <div className="relative aspect-video w-full rounded-[12px] overflow-hidden bg-neutral-900">
                    {renderThumbImg(card)}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-[4px] bg-black/80 text-white text-[11px] font-medium tabular-nums">
                      {card.duration}
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-start gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 uppercase ${
                        card.isUser
                          ? 'bg-red-600 text-white'
                          : isBright
                          ? 'bg-neutral-200 text-neutral-800'
                          : 'bg-neutral-800 text-neutral-200'
                      }`}
                    >
                      {card.channel.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-[15px] leading-[20px] font-medium line-clamp-2 ${ytTitleColor}`}
                        style={{ maxWidth: '33ch' }}
                      >
                        {card.title}
                      </h3>
                      <div className={`text-[12px] leading-[18px] mt-0.5 truncate ${ytMetaColor}`}>
                        {card.channel} · {card.views} · {card.timeAgo}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLET WATCH SPLIT VIEW */
            <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7 space-y-2.5">
                <div className="relative aspect-video w-full rounded-[12px] overflow-hidden bg-black flex items-center justify-center">
                  {playingCard.thumbUrl && (
                    <img
                      src={playingCard.thumbUrl}
                      alt="Player"
                      className="w-full h-full object-cover opacity-50"
                    />
                  )}
                  <div className="absolute w-12 h-9 rounded-lg bg-[#FF0000] flex items-center justify-center text-white">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
                <h2 className={`text-[16px] font-bold leading-[22px] ${ytTitleColor}`}>
                  {playingCard.title}
                </h2>
              </div>

              <div className="md:col-span-5 space-y-3">
                {cards.slice(0, 5).map((card) => (
                  <div key={card.id} className="flex items-start gap-2.5">
                    <div className="relative w-[196px] h-[110px] rounded-[10px] overflow-hidden bg-neutral-900 shrink-0">
                      {renderThumbImg(card)}
                      <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-white text-[10px] font-semibold tabular-nums">
                        {card.duration}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h4
                        className={`text-[13px] leading-[18px] font-semibold line-clamp-2 break-words ${ytTitleColor}`}
                      >
                        {card.title}
                      </h4>
                      <div className={`text-[11px] leading-[16px] mt-1 truncate ${ytMetaColor}`}>
                        {card.channel}
                      </div>
                      <div className={`flex items-center gap-1 text-[11px] leading-[15px] truncate mt-0.5 ${ytMetaColor}`}>
                        <svg
                          viewBox="0 0 16 16"
                          className="w-2.5 h-2.5 fill-none stroke-current stroke-[1.5] shrink-0"
                        >
                          <polygon points="4,2.5 13,8 4,13.5" />
                        </svg>
                        <span>{card.views}</span>
                        <span>{card.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 4. SMART TV (YouTube Living Room 10-ft UI · Exact 1:1 Match to Reference)
  // ============================================================================
  return (
    <SmartTVSimulatorView
      cards={cards}
      playingCard={playingCard}
      effectiveChannel={effectiveChannel}
      placement={placement}
      userPositionIndex={userPositionIndex}
      fullscreenCarouselRef={fullscreenCarouselRef}
      isDraggingCarousel={isDraggingCarousel}
      handleCarouselMouseDown={handleCarouselMouseDown}
      handleCarouselMouseMove={handleCarouselMouseMove}
      stopCarouselDragging={stopCarouselDragging}
    />
  );
};

interface SmartTVSimulatorViewProps {
  cards: SimCard[];
  playingCard: SimCard;
  effectiveChannel: string;
  placement: ABPlacementMode;
  userPositionIndex: number;
  fullscreenCarouselRef: React.RefObject<HTMLDivElement | null>;
  isDraggingCarousel: boolean;
  handleCarouselMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleCarouselMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  stopCarouselDragging: () => void;
}

const SmartTVSimulatorView: React.FC<SmartTVSimulatorViewProps> = ({
  cards,
  playingCard,
  effectiveChannel,
  placement,
  userPositionIndex,
  fullscreenCarouselRef,
  isDraggingCarousel,
  handleCarouselMouseDown,
  handleCarouselMouseMove,
  stopCarouselDragging,
}) => {
  // TV Homepage state: choose whether the user's variation appears in "Recommended shows" (top) or "Continue watching" (bottom)
  const [tvHomeSection, setTvHomeSection] = React.useState<'recommended' | 'continue'>('recommended');

  // Row state for TV Suggested ("Sugeridos (Viendo un video)"):
  // 0 = Foto 1: Viendo el video con controles activos y la Fila 1 (3 miniaturas) asomando abajo
  // 1 = Foto 2: Bajas con el control -> Fila 1 (3 packs) sube y se ve entera + Fila 2 (siguientes 3) asoma abajo
  // 2 = Foto 3: Bajas de nuevo -> Fila 2 (3 packs) sube y se ve entera + Fila 3 (siguientes 3) asoma abajo
  // 3 = Fila 3 entera + Fila 4 asomando abajo
  // 4 = Fila 4 entera + Fila 5 asomando abajo
  const [tvSuggestedStep, setTvSuggestedStep] = React.useState<number>(0);
  // Which row (0-indexed: 0 = Fila 1, 1 = Fila 2, 2 = Fila 3) holds the user's variation
  const [userTargetRow, setUserTargetRow] = React.useState<number>(0);

  // TV Background ("Mirando el video") controls: randomize playing video or set screen to pure black
  const [isBlackVideoBg, setIsBlackVideoBg] = React.useState<boolean>(false);
  const [playingBgIndex, setPlayingBgIndex] = React.useState<number>(0);

  const MAX_SUGGESTED_STEP = 4; // Steps 0..4 (with 5 rows of 3 = 15 cards so there is ALWAYS a next row peeking)

  // Build separate non-overlapping lists for TV Homepage: Top ("Recommended shows") and Bottom ("Continue watching")
  const { tvHomeRecommendedCards, tvHomeContinueCards } = React.useMemo(() => {
    const userCard = cards.find((c) => c.isUser) || null;
    const competitorPool = cards.filter((c) => !c.isUser);
    const fallbackCompetitor: SimCard = {
      isUser: false,
      id: 'tv-home-fallback',
      title: 'Why Indie Games Fail Before Launch',
      channel: 'Indie Game Clinic',
      thumbUrl: playingCard.thumbUrl,
      duration: '14:22',
      views: '84K',
      timeAgo: '2w ago',
    };

    const filled: SimCard[] = [];
    for (let i = 0; i < 10; i++) {
      const base =
        competitorPool.length > 0
          ? competitorPool[i % competitorPool.length]
          : fallbackCompetitor;
      filled.push({
        ...base,
        id: `${base.id}-tvhome-${i}`,
        isUser: false,
      });
    }

    const recList = filled.slice(0, 6);
    const contList = filled.slice(6, 10);

    if (userCard) {
      if (tvHomeSection === 'recommended') {
        const pos = userPositionIndex % 2; // 0 or 1 so it is always one of the 2 full cards in Recommended shows
        recList.splice(pos, 1, userCard);
      } else {
        const pos = userPositionIndex % 3; // 0, 1, or 2 so it is always visible in Continue watching
        contList.splice(pos, 1, userCard);
      }
    }

    return {
      tvHomeRecommendedCards: recList,
      tvHomeContinueCards: contList,
    };
  }, [cards, playingCard.thumbUrl, tvHomeSection, userPositionIndex]);

  // Candidate pool for the currently playing video on TV
  const playingVideoPool = React.useMemo(() => {
    const repoCompetitors = cards.filter((c) => !c.isUser);
    return [playingCard, ...repoCompetitors];
  }, [playingCard, cards]);

  const activePlayingCard =
    playingVideoPool[playingBgIndex % playingVideoPool.length] || playingCard;

  const handleRandomizePlayingVideo = () => {
    setIsBlackVideoBg(false);
    if (playingVideoPool.length <= 1) return;
    setPlayingBgIndex((prev) => {
      const currentIdx = prev % playingVideoPool.length;
      let nextIdx = Math.floor(Math.random() * playingVideoPool.length);
      if (nextIdx === currentIdx) {
        nextIdx = (currentIdx + 1) % playingVideoPool.length;
      }
      return nextIdx;
    });
  };

  // Build a 15-card array (5 rows of 3 columns) so every step has 3 full packs + 3 peeking packs below
  const tvSuggestedGridCards = React.useMemo(() => {
    const userCard = cards.find((c) => c.isUser) || null;
    const competitorPool = cards.filter(
      (c) => !c.isUser && c.id !== activePlayingCard.id
    );
    const fallbackCompetitor: SimCard = {
      isUser: false,
      id: 'tv-comp-fallback',
      title: 'Why Indie Games Fail Before Launch',
      channel: 'Indie Game Clinic',
      thumbUrl: activePlayingCard.thumbUrl,
      duration: '14:22',
      views: '84K',
      timeAgo: '2w ago',
    };

    const filledCompetitors: SimCard[] = [];
    for (let i = 0; i < 15; i++) {
      const base =
        competitorPool.length > 0
          ? competitorPool[i % competitorPool.length]
          : fallbackCompetitor;
      filledCompetitors.push({
        ...base,
        id: `${base.id}-tvslot-${i}`,
        isUser: false,
      });
    }

    if (userCard) {
      const colInRow = ((userPositionIndex % 3) + 3) % 3;
      const targetIndex = Math.min(14, userTargetRow * 3 + colInRow);
      filledCompetitors.splice(targetIndex, 1, userCard);
    }

    return filledCompetitors.slice(0, 15);
  }, [cards, activePlayingCard, userPositionIndex, userTargetRow]);

  // Group into 5 rows of 3 cards each
  const suggestedRows = React.useMemo(() => {
    const rows: SimCard[][] = [];
    for (let r = 0; r < 5; r++) {
      rows.push(tvSuggestedGridCards.slice(r * 3, r * 3 + 3));
    }
    return rows;
  }, [tvSuggestedGridCards]);

  const handleStepNext = React.useCallback(() => {
    setTvSuggestedStep((prev) => Math.min(MAX_SUGGESTED_STEP, prev + 1));
  }, []);

  const handleStepPrev = React.useCallback(() => {
    setTvSuggestedStep((prev) => Math.max(0, prev - 1));
  }, []);

  // Exact vertical translateY math inside the 560px TV viewport:
  // - Player Top & Controls Block = 452px tall (so at Step 0, Row 0 starts at y=452px -> top 108px of Row 0's 3 thumbnails peeks at bottom!)
  // - Each Suggested Row = 168px (16:9 thumb) + 74px (2-line title + channel/views/time) = 242px tall
  // - Gap between rows = 24px -> Row Step = 266px
  // - At Step 1 (Fila 1): translateY = -254px -> Row 0 sits at y=198px..440px (100% visible entero!) and Row 1 starts at y=464px (top 96px of next 3 thumbnails peeks at bottom!)
  // - At Step k (Fila k): translateY = -(254 + (k - 1) * 266)px -> Row (k-1) sits at y=198px..440px (entero) and Row k starts at y=464px (top 96px peeks at bottom!)
  const trackTranslateY =
    tvSuggestedStep === 0 ? 0 : -(254 + (tvSuggestedStep - 1) * 266);

  return (
    <div className="flex flex-col items-center py-2 space-y-3">
      {/* TV Homepage Section Selector Bar (Choose between Recommended shows vs Continue watching) */}
      {placement === 'home' && (
        <div className="w-full max-w-[1040px] rounded-2xl border border-neutral-800 bg-neutral-900/90 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-200 shadow-lg">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
              Ubicación de tu pack en TV Homepage:
            </span>

            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => setTvHomeSection('recommended')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tvHomeSection === 'recommended'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Recommended shows (Fila 1)
              </button>

              <button
                type="button"
                onClick={() => setTvHomeSection('continue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  tvHomeSection === 'continue'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Continue watching (Fila 2)
              </button>
            </div>
          </div>

          <span className="text-[11px] text-neutral-400">
            {tvHomeSection === 'recommended'
              ? 'Tu variación se muestra en la fila 1 (Recommended shows)'
              : 'Tu variación se muestra en la fila 2 (Continue watching)'}
          </span>
        </div>
      )}

      {/* Interactive TV Remote Control Bar (Only in Sugeridos / Watch mode) */}
      {placement !== 'home' && (
        <div className="w-full max-w-[1040px] rounded-2xl border border-neutral-800 bg-neutral-900/90 px-4 py-2.5 flex flex-col gap-2.5 text-xs text-neutral-200 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                Control Remoto TV:
              </span>

              <button
                type="button"
                onClick={handleStepPrev}
                disabled={tvSuggestedStep === 0}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  tvSuggestedStep === 0
                    ? 'border-neutral-800 bg-neutral-950/50 text-neutral-600 cursor-not-allowed'
                    : 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer'
                }`}
                title="Subir una fila"
              >
                <span>&#9650; / &#9664; Subir</span>
              </button>

              <button
                type="button"
                onClick={handleStepNext}
                disabled={tvSuggestedStep === MAX_SUGGESTED_STEP}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ${
                  tvSuggestedStep === MAX_SUGGESTED_STEP
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
                }`}
                title="Bajar una fila en la cuadrícula de 3"
              >
                <span>&#9660; / &#9654; Bajar fila (Ver siguientes 3)</span>
              </button>

              {/* Step Pills */}
              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                {[
                  { step: 0, label: '1. Video' },
                  { step: 1, label: '2. Fila 1' },
                  { step: 2, label: '3. Fila 2' },
                  { step: 3, label: '4. Fila 3' },
                ].map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setTvSuggestedStep(item.step)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                      tvSuggestedStep === item.step
                        ? 'bg-white text-black shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Choose which row holds the user's variation pack */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-neutral-400 font-medium">Tu pack en:</span>
              {[0, 1, 2].map((rIdx) => (
                <button
                  key={rIdx}
                  type="button"
                  onClick={() => {
                    setUserTargetRow(rIdx);
                  }}
                  className={`px-2 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    userTargetRow === rIdx
                      ? 'bg-red-600/20 text-red-400 border border-red-500/40'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  Fila {rIdx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2 of TV Controls: Video Background ("Mirando el video") Randomize or Black Screen */}
          <div className="pt-2 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-neutral-400 font-medium">
                Pantalla del video en reproducción:
              </span>

              <button
                type="button"
                onClick={handleRandomizePlayingVideo}
                className="px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Cambiar aleatoriamente el video que se está viendo en el fondo de la TV"
              >
                <Shuffle className="w-3 h-3" />
                <span>Randomizar video de fondo</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBlackVideoBg((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isBlackVideoBg
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-600'
                }`}
                title="Dejar el fondo del reproductor completamente en negro"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full border ${
                    isBlackVideoBg
                      ? 'bg-black border-black'
                      : 'bg-black border-neutral-500'
                  }`}
                />
                <span>{isBlackVideoBg ? 'Fondo negro (Activo)' : 'Dejar en negro'}</span>
              </button>
            </div>

            <span className="text-neutral-500 truncate max-w-sm">
              {isBlackVideoBg
                ? 'Fondo: Pantalla en negro'
                : `Viendo: ${activePlayingCard.title}`}
            </span>
          </div>
        </div>
      )}

      {/* Outer TV Monitor Bezel (Same neutral-800 frame color as Mobile and Tablet) */}
      <div className="w-full max-w-[1040px] bg-black rounded-[18px] border-[6px] border-neutral-800 shadow-2xl overflow-hidden select-none text-white">
        {placement === 'home' ? (
          /* SMART TV HOME PAGE (Left Icon Rail + Search/Premium Header + 2.3-Card Main Shelf + Cropped Bottom "Continue watching" Row) */
          <div className="flex h-[560px] bg-[#0f0f0f] overflow-hidden">
            {/* Left Narrow TV Icon Rail */}
            <div className="w-16 shrink-0 flex flex-col items-center justify-between py-5 bg-[#0f0f0f] z-10">
              {/* Top User Avatar */}
              <div className="w-7 h-7 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center uppercase ring-2 ring-white/20">
                {effectiveChannel.charAt(0)}
              </div>

              {/* Center Navigation Icons */}
              <div className="flex flex-col items-center gap-4 text-neutral-400">
                <Search className="w-4 h-4 hover:text-white" />
                <div className="p-1.5 rounded-full text-white">
                  <Home className="w-4 h-4 fill-white" />
                </div>
                <Compass className="w-4 h-4 hover:text-white" />
                <PlaySquare className="w-4 h-4 hover:text-white" />
                <Video className="w-4 h-4 hover:text-white" />
                <Volume2 className="w-4 h-4 hover:text-white" />
              </div>

              {/* Bottom Settings Icon */}
              <Settings className="w-4 h-4 text-neutral-500" />
            </div>

            {/* Right Main TV Content Area (pl-4 ensures the first pack is never clipped by the left sidebar) */}
            <div className="flex-1 min-w-0 flex flex-col justify-between pt-5 pl-4 pr-0 overflow-hidden">
              {/* Top Bar: Mic + Search Pill + YouTube Premium */}
              <div className="pr-8 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#272727] flex items-center justify-center text-white">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="w-64 h-8 rounded-full bg-[#272727] px-4 flex items-center text-[13px] font-medium text-neutral-200">
                    Search
                  </div>
                </div>

                {/* YouTube Premium Logo on top-right */}
                <div className="flex items-center gap-1">
                  <div className="w-6 h-4 rounded-[4px] bg-[#FF0000] flex items-center justify-center text-white">
                    <Youtube className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <span className="font-bold text-[15px] tracking-tight text-white">
                    Premium
                  </span>
                </div>
              </div>

              {/* Shelf 1: Recommended (2 full large cards + ~1/3 of 3rd card peeking on right, draggable with mouse, NO white rings) */}
              <div className="mt-4">
                <div className="text-[12px] font-semibold text-neutral-300 mb-2.5">
                  Recommended shows
                </div>

                <div
                  ref={fullscreenCarouselRef}
                  onMouseDown={handleCarouselMouseDown}
                  onMouseMove={handleCarouselMouseMove}
                  onMouseUp={stopCarouselDragging}
                  onMouseLeave={stopCarouselDragging}
                  className={`flex items-start gap-4 overflow-x-auto scrollbar-none pr-8 pt-1 pb-1 ${
                    isDraggingCarousel ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                >
                  {tvHomeRecommendedCards.map((card) => (
                    <div
                      key={card.id}
                      className="w-[390px] shrink-0 flex flex-col select-none"
                    >
                      <div className="relative aspect-video w-full rounded-[14px] overflow-hidden bg-neutral-900">
                        <img
                          src={card.thumbUrl}
                          alt={card.title}
                          draggable={false}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            if (card.fallbackThumbUrl) {
                              (e.target as HTMLImageElement).src = card.fallbackThumbUrl;
                            }
                          }}
                          className="w-full h-full object-cover pointer-events-none select-none"
                        />
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[11px] font-semibold tabular-nums">
                          {card.duration}
                        </div>
                      </div>

                      <div className="mt-2.5 pr-2 space-y-0.5">
                        <h3
                          className="text-[15px] leading-[19px] font-bold text-white line-clamp-2"
                          style={{ maxWidth: '26ch' }}
                        >
                          {card.title}
                        </h3>
                        <div className="text-[11px] leading-[15px] text-neutral-400 truncate">
                          {card.channel} · {card.views} views · {card.timeAgo}
                        </div>
                        <div className="text-[11px] leading-[14px] text-neutral-500 truncate">
                          {card.channel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shelf 2: "Continue watching" Bottom Row (Shows 35% of the 160px thumbnail height -> h-[56px] at the bottom edge of the TV) */}
              <div className="mt-3">
                <div className="text-[12px] font-semibold text-neutral-300 mb-2">
                  Continue watching
                </div>
                <div className="flex items-start gap-3.5 overflow-hidden">
                  {tvHomeContinueCards.map((card) => (
                    <div
                      key={`cw-${card.id}`}
                      className="w-[285px] h-[56px] shrink-0 rounded-t-[12px] overflow-hidden bg-neutral-900 relative"
                    >
                      <img
                        src={card.thumbUrl}
                        alt={card.title}
                        draggable={false}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          if (card.fallbackThumbUrl) {
                            (e.target as HTMLImageElement).src = card.fallbackThumbUrl;
                          }
                        }}
                        className="w-full h-[160px] object-cover object-top pointer-events-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SMART TV SUGGESTED (Viendo un video · 3-Column Vertical Grid that slides up row-by-row via buttons) */
          <div className="relative h-[560px] bg-black overflow-hidden">
            {/* Full-screen Currently Playing Video Frame in Background (hidden if user selected Black Screen) */}
            {!isBlackVideoBg && activePlayingCard.thumbUrl && (
              <img
                src={activePlayingCard.thumbUrl}
                alt={activePlayingCard.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  if (activePlayingCard.fallbackThumbUrl) {
                    (e.target as HTMLImageElement).src = activePlayingCard.fallbackThumbUrl;
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}

            {/* Dynamic Scrim: Darker when navigating the Suggested Grid rows (Foto 2 & Foto 3) so pack titles pop */}
            <div
              className={`absolute inset-0 transition-colors duration-300 ${
                isBlackVideoBg
                  ? 'bg-black'
                  : tvSuggestedStep === 0
                  ? 'bg-gradient-to-b from-black/65 via-black/15 to-black/90'
                  : 'bg-black/75'
              }`}
            />

            {/* Vertically Sliding Track containing Player Controls + 5 Rows of 3-Column Suggested Packs */}
            <div
              className="relative z-10 px-10 transition-transform duration-300 ease-out"
              style={{ transform: `translateY(${trackTranslateY}px)` }}
            >
              {/* PART 1: Video Player Info & Controls Block (Exact 452px height -> Row 1 starts at y=452px) */}
              <div className="h-[452px] flex flex-col justify-between pt-7 pb-4">
                {/* Top Overlay: Playing Video Title & Channel Metadata on Left (No floating bell icon) */}
                <div className="flex items-start justify-between">
                  <div className="max-w-md space-y-1">
                    <h2 className="text-[20px] leading-[25px] font-bold text-white drop-shadow-md line-clamp-2">
                      {activePlayingCard.title}
                    </h2>
                    <div className="text-[11px] font-medium text-neutral-200 drop-shadow">
                      {activePlayingCard.channel} · {activePlayingCard.views} views ·{' '}
                      {activePlayingCard.timeAgo}
                    </div>
                  </div>
                </div>

                {/* Lower Player Scrubber + Three-Zone TV Player Controls */}
                <div className="space-y-3.5">
                  {/* Timestamps + Scrubber Line */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-white tabular-nums">
                      <span>0:08</span>
                      <span>{activePlayingCard.duration}</span>
                    </div>
                    <div className="relative h-1 w-full rounded-full bg-white/30">
                      <div className="absolute left-0 top-0 bottom-0 w-[12%] rounded-full bg-white" />
                      <div className="absolute left-[12%] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow" />
                    </div>
                  </div>

                  {/* Three-Zone TV Player Controls Row */}
                  <div className="flex items-center justify-between">
                    {/* Left: Channel Avatar + Description Pill + Bell */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs font-bold uppercase">
                        {activePlayingCard.channel.charAt(0)}
                      </div>
                      <div className="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-semibold text-white">
                        Description
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Center: Prev + Play + Next */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs">
                        &#9198;
                      </div>
                      <div
                        onClick={() => setTvSuggestedStep(0)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-colors ${
                          tvSuggestedStep === 0
                            ? 'bg-white text-black'
                            : 'bg-white/25 text-white hover:bg-white/40'
                        }`}
                      >
                        <Play
                          className={`w-4 h-4 ml-0.5 ${
                            tvSuggestedStep === 0 ? 'fill-black' : 'fill-white'
                          }`}
                        />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs">
                        &#9197;
                      </div>
                    </div>

                    {/* Right: Like, Dislike, Share, Maximize, Settings */}
                    <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center">
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center">
                        <ThumbsUp className="w-3.5 h-3.5 rotate-180" />
                      </div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center">
                        <Share2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center">
                        <Maximize className="w-3.5 h-3.5" />
                      </div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PART 2: 3-Column Suggested Videos Grid (Each Row = 242px tall + 24px mb = 266px step) */}
              <div>
                {suggestedRows.map((rowCards, rowIndex) => {
                  const isPeekingRow = tvSuggestedStep === rowIndex;

                  return (
                    <div
                      key={`tv-sug-row-${rowIndex}`}
                      onClick={() => {
                        if (isPeekingRow) {
                          setTvSuggestedStep(rowIndex + 1);
                        }
                      }}
                      className={`grid grid-cols-3 gap-5 h-[242px] mb-[24px] ${
                        isPeekingRow ? 'cursor-pointer' : ''
                      }`}
                    >
                      {rowCards.map((card) => (
                        <div
                          key={card.id}
                          className="flex flex-col select-none"
                        >
                          {/* 16:9 Thumbnail (300x168px, clean without white borders) */}
                          <div className="relative h-[168px] w-full rounded-[12px] overflow-hidden bg-neutral-900 shrink-0">
                            <img
                              src={card.thumbUrl}
                              alt={card.title}
                              draggable={false}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                if (card.fallbackThumbUrl) {
                                  (e.target as HTMLImageElement).src = card.fallbackThumbUrl;
                                }
                              }}
                              className="w-full h-full object-cover pointer-events-none select-none"
                            />
                            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-white text-[11px] font-semibold tabular-nums">
                              {card.duration}
                            </div>
                          </div>

                          {/* Full Pack Metadata below Thumbnail (Visible when the row slides up into view) */}
                          <div className="h-[74px] pt-2.5 pr-1 flex flex-col justify-start overflow-hidden">
                            <h3
                              className="text-[15px] leading-[19px] font-bold text-white line-clamp-2"
                              style={{ maxWidth: '25ch' }}
                            >
                              {card.title}
                            </h3>
                            <div className="text-[11px] leading-[15px] text-neutral-300 truncate mt-1">
                              {card.channel} · {card.views} views · {card.timeAgo}
                            </div>
                            <div className="text-[11px] leading-[14px] text-neutral-400 truncate">
                              {card.channel}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Realistic Angled TV Stand Legs matching neutral-800 bezel */}
      <div className="w-full max-w-[760px] flex items-start justify-between px-16 pointer-events-none -mt-3">
        <div className="w-3.5 h-10 bg-neutral-800 rotate-[28deg] rounded-b" />
        <div className="w-3.5 h-10 bg-neutral-800 -rotate-[28deg] rounded-b" />
      </div>
    </div>
  );
};


