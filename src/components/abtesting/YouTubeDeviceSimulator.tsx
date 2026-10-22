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
  // so the video being watched never repeats in the suggested list below/beside the user's A/B variation
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
    <div className="flex flex-col items-center py-2">
      {/* Outer TV Monitor Bezel */}
      <div className="w-full max-w-[1040px] bg-black border-[10px] border-neutral-950 shadow-2xl overflow-hidden select-none text-white">
        {placement === 'home' ? (
          /* SMART TV HOME PAGE (Left Icon Rail + Search/Premium Header + 2.3-Card Main Shelf + Cropped Bottom "Continue watching" Row) */
          <div className="flex h-[560px] bg-[#0f0f0f] overflow-hidden">
            {/* Left Narrow TV Icon Rail */}
            <div className="w-14 shrink-0 flex flex-col items-center justify-between py-5 bg-[#0f0f0f]">
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

            {/* Right Main TV Content Area */}
            <div className="flex-1 min-w-0 flex flex-col justify-between pt-4 pl-2 pr-0 overflow-hidden">
              {/* Top Bar: Mic + Search Pill + Mute Bell + YouTube Premium */}
              <div className="pr-8 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#272727] flex items-center justify-center text-white">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div className="w-64 h-8 rounded-full bg-[#272727] px-4 flex items-center text-[13px] font-medium text-neutral-200">
                    Search
                  </div>
                  {/* Mute bell icon seen in TV top bar */}
                  <div className="ml-6 text-neutral-300 opacity-80">
                    <Bell className="w-4 h-4" />
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

              {/* Shelf 1: Recommended (2 full large cards + ~1/3 of 3rd card peeking on right, draggable with mouse) */}
              <div className="mt-3">
                <div className="text-[12px] font-semibold text-neutral-300 mb-2">
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
                  {cards.slice(0, 6).map((card, idx) => {
                    const isFocused = card.isUser || idx === 0;
                    return (
                      <div
                        key={card.id}
                        className="w-[390px] shrink-0 flex flex-col select-none"
                      >
                        <div
                          className={`relative aspect-video w-full rounded-[14px] overflow-hidden bg-neutral-900 ${
                            card.isUser
                              ? 'ring-[3px] ring-white shadow-xl'
                              : isFocused
                              ? 'ring-[2px] ring-white/80'
                              : ''
                          }`}
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
                    );
                  })}
                </div>
              </div>

              {/* Shelf 2: "Continue watching" Bottom Row (Cut off at ~55% height by bottom TV bezel, no titles visible) */}
              <div className="mt-2">
                <div className="text-[12px] font-semibold text-neutral-300 mb-2">
                  Continue watching
                </div>
                <div className="flex items-start gap-3.5 overflow-hidden">
                  {cards.slice(2, 6).map((card) => (
                    <div
                      key={`cw-${card.id}`}
                      className="w-[285px] h-[92px] shrink-0 rounded-t-[12px] overflow-hidden bg-neutral-900 relative"
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
          /* SMART TV SUGGESTED (Viendo un video · Playing Video + Player Controls + 3 Bottom Thumbnails Strip with NO titles) */
          <div className="relative h-[560px] bg-black flex flex-col justify-between overflow-hidden">
            {/* Full-screen Currently Playing Video Frame */}
            {playingCard.thumbUrl && (
              <img
                src={playingCard.thumbUrl}
                alt={playingCard.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Subtle top and bottom vignette scrims */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/90" />

            {/* Top Overlay: Playing Video Title & Channel Metadata on Left + Mute Bell in Center */}
            <div className="relative z-10 pt-7 px-10 flex items-start justify-between">
              <div className="max-w-md space-y-1">
                <h2 className="text-[20px] leading-[25px] font-bold text-white drop-shadow-md line-clamp-2">
                  {playingCard.title}
                </h2>
                <div className="text-[11px] font-medium text-neutral-200 drop-shadow">
                  {playingCard.channel} · {playingCard.views} views · {playingCard.timeAgo}
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/90">
                <Bell className="w-4 h-4" />
              </div>
              <div className="w-20" />
            </div>

            {/* Bottom Overlay: Progress Bar + Player Control Buttons + 3-Thumbnail Suggested Strip (No titles) */}
            <div className="relative z-10 px-10 space-y-3.5">
              {/* Timestamps + Scrubber Line */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-white tabular-nums">
                  <span>0:08</span>
                  <span>{playingCard.duration}</span>
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
                    {playingCard.channel.charAt(0)}
                  </div>
                  <div className="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-semibold text-white">
                    Description
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Center: Prev + Play (Active White Circle) + Next */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs">
                    &#9198;
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-black ml-0.5" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xs">
                    &#9197;
                  </div>
                </div>

                {/* Right: Like, Dislike, Comments, Save, Captions, Settings */}
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

              {/* Bottom Suggested Strip: 3 Thumbnails across bottom edge, NO titles visible, draggable with mouse */}
              <div
                ref={fullscreenCarouselRef}
                onMouseDown={handleCarouselMouseDown}
                onMouseMove={handleCarouselMouseMove}
                onMouseUp={stopCarouselDragging}
                onMouseLeave={stopCarouselDragging}
                className={`pt-1 flex items-start gap-3.5 overflow-x-auto scrollbar-none ${
                  isDraggingCarousel ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              >
                {cards.slice(0, 6).map((card) => (
                  <div
                    key={card.id}
                    className={`w-[295px] h-[126px] shrink-0 rounded-t-[12px] overflow-hidden bg-neutral-900 relative ${
                      card.isUser ? 'ring-[3px] ring-white shadow-2xl' : ''
                    }`}
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
                      className="w-full h-[165px] object-cover object-top pointer-events-none select-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Realistic Angled TV Stand Legs matching Reference Image */}
      <div className="w-full max-w-[760px] flex items-start justify-between px-16 pointer-events-none">
        <div className="w-4 h-12 bg-neutral-900 dark:bg-neutral-800 rotate-[28deg] -mt-1 rounded-b" />
        <div className="w-4 h-12 bg-neutral-900 dark:bg-neutral-800 -rotate-[28deg] -mt-1 rounded-b" />
      </div>
    </div>
  );
};
