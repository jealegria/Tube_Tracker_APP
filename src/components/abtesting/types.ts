export interface ABTestVariation {
  id: string;
  label: string;
  title: string;
  thumbnailUrl: string;
  createdAt: number;
}

export interface ABTestVideoProject {
  id: string;
  videoNumber: number;
  name: string;
  variations: ABTestVariation[];
  createdAt: number;
}

export type ABPlacementMode = 'home' | 'sidebar' | 'fullscreen';
export type ABDeviceType = 'pc' | 'mobile' | 'tablet' | 'tv';
export type ABPreviewTheme = 'dark' | 'light';

export interface YouTubeContextSpec {
  maxVisibleChars: number;
  charsPerLine: number;
  maxLines: number;
  thumbRatio: string;
  description: string;
}

export const YOUTUBE_SPECS: Record<
  ABDeviceType,
  Record<ABPlacementMode, YouTubeContextSpec>
> = {
  pc: {
    home: {
      maxVisibleChars: 70,
      charsPerLine: 35,
      maxLines: 2,
      thumbRatio: '16:9 (360×202px ref · border-radius 12px)',
      description: 'YouTube Web Desktop Home Feed · Roboto 16px Medium (line-height 22px)',
    },
    sidebar: {
      maxVisibleChars: 40,
      charsPerLine: 20,
      maxLines: 2,
      thumbRatio: '16:9 (246×138px · ~62% del ancho del sidebar · radius 12px)',
      description: 'YouTube Watch Sidebar actual · Miniatura grande + columna de texto angosta (~20 car./línea)',
    },
    fullscreen: {
      maxVisibleChars: 40,
      charsPerLine: 20,
      maxLines: 2,
      thumbRatio: '16:9 (radius 12px)',
      description: 'YouTube Web Fullscreen',
    },
  },
  mobile: {
    home: {
      maxVisibleChars: 64,
      charsPerLine: 32,
      maxLines: 2,
      thumbRatio: '16:9 (390×219px full-bleed / 12px radius)',
      description: 'YouTube Mobile App Home Feed · Roboto 14px Medium (line-height 18px)',
    },
    sidebar: {
      maxVisibleChars: 62,
      charsPerLine: 31,
      maxLines: 2,
      thumbRatio: '16:9 full-bleed (Debajo de reproductor, acciones y caja de Comentarios)',
      description: 'YouTube Mobile Watch Page · Reproductor + Likes/Suscribirse + Comentarios + Up Next',
    },
    fullscreen: {
      maxVisibleChars: 38,
      charsPerLine: 38,
      maxLines: 1,
      thumbRatio: '16:9 (2 miniaturas completas + 2/10 de la 3ra · radius 12px)',
      description:
        'YouTube Mobile Fullscreen Horizontal ("Más videos") · Título a 1 línea (~38 car.) · Arrastra con el mouse para deslizar',
    },
  },
  tablet: {
    home: {
      maxVisibleChars: 66,
      charsPerLine: 33,
      maxLines: 2,
      thumbRatio: '16:9 (2 columnas iPadOS/Android Tablet · radius 12px)',
      description: 'YouTube Tablet Home Grid · Roboto 15px Medium (line-height 20px)',
    },
    sidebar: {
      maxVisibleChars: 38,
      charsPerLine: 19,
      maxLines: 2,
      thumbRatio: '16:9 (Miniatura 60% ancho lateral · radius 12px)',
      description: 'YouTube Tablet Watch Sidebar · Roboto 13px Medium (~19 car./línea)',
    },
    fullscreen: {
      maxVisibleChars: 38,
      charsPerLine: 38,
      maxLines: 1,
      thumbRatio: '16:9 (radius 12px)',
      description: 'YouTube Tablet Fullscreen',
    },
  },
  tv: {
    home: {
      maxVisibleChars: 46,
      charsPerLine: 23,
      maxLines: 2,
      thumbRatio: '16:9 (2 completas + 1/3 de la 3ra · Fila inferior "Continue watching")',
      description:
        'YouTube Smart TV Home Page · 2 miniaturas completas con título + 3ra lateral (Arrastra con el mouse)',
    },
    sidebar: {
      maxVisibleChars: 46,
      charsPerLine: 23,
      maxLines: 2,
      thumbRatio: '16:9 (Cuadrícula de 3 por fila)',
      description:
        'YouTube Smart TV Sugeridos (Viendo un video) · Cuadrícula de 3 columnas que sube fila por fila con el control (↓ o →)',
    },
    fullscreen: {
      maxVisibleChars: 44,
      charsPerLine: 22,
      maxLines: 2,
      thumbRatio: '16:9 (radius 16px)',
      description: 'YouTube Smart TV Fullscreen',
    },
  },
};
