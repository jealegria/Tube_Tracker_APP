import { PackagingItem } from '../types';

export function extractYouTubeId(rawInput: string): string | null {
  if (!rawInput) return null;
  const input = rawInput.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  const pattern = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = input.match(pattern);
  return match ? match[1] : null;
}

export function getCanonicalWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function getThumbnailUrls(videoId: string) {
  return {
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    hq: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    mq: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  };
}

export async function fetchYouTubeInfo(videoId: string): Promise<{ title: string; channelTitle: string }> {
  const watchUrl = encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);

  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${watchUrl}&format=json`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.title) {
        return {
          title: data.title,
          channelTitle: data.author_name || 'YouTube Creator',
        };
      }
    }
  } catch {
    // Fallback to noembed
  }

  try {
    const res = await fetch(`https://noembed.com/embed?url=${watchUrl}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.title && !data.error) {
        return {
          title: data.title,
          channelTitle: data.author_name || 'YouTube Creator',
        };
      }
    }
  } catch {
    // Fallback to default title
  }

  return {
    title: `Video de YouTube (${videoId})`,
    channelTitle: 'Canal de YouTube',
  };
}

export const DEFAULT_TAGS = ['Contrarian', 'Versus', 'Shock', 'Meme', 'Gooner', 'Impact', 'Raw'];

export const INITIAL_SAMPLE_PACKAGINGS: PackagingItem[] = [
  {
    id: 'sample-1',
    videoId: '0e3GPea1Tyg',
    url: 'https://www.youtube.com/watch?v=0e3GPea1Tyg',
    title: '$456,000 Squid Game In Real Life!',
    channelTitle: 'MrBeast',
    category: 'Formatos',
    tags: ['Impact', 'Versus'],
    notes: 'Escala masiva y recreación 1:1 de una serie viral del momento. Alto contraste visual, ropa verde característica y premio en números gigantes en el título.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    favorite: true,
  },
  {
    id: 'sample-2',
    videoId: 'bHIhgxav9LY',
    url: 'https://www.youtube.com/watch?v=bHIhgxav9LY',
    title: 'How One Man Tricked The Entire World',
    channelTitle: 'Veritasium',
    category: 'Ideas',
    tags: ['Contrarian', 'Shock'],
    notes: 'Packaging de intriga pura. Silueta misteriosa + pregunta que abre un bucle de curiosidad que no podés no hacer clic.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    favorite: true,
  },
  {
    id: 'sample-3',
    videoId: 'xoxhDk-hwuo',
    url: 'https://www.youtube.com/watch?v=xoxhDk-hwuo',
    title: 'World’s Most Dangerous Glitch',
    channelTitle: 'Mark Rober',
    category: 'Ideas',
    tags: ['Raw', 'Shock'],
    notes: 'Título ultra corto (4 palabras). La miniatura no tiene texto, solo muestra el objeto en situación extrema con flecha sutil.',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
    favorite: false,
  },
  {
    id: 'sample-4',
    videoId: 'Wp_K7h2fE2A',
    url: 'https://www.youtube.com/watch?v=Wp_K7h2fE2A',
    title: 'I Survived 7 Days In A Solitary Confinement Bunker',
    channelTitle: 'Ryan Trahan',
    category: 'Formatos',
    tags: ['Impact', 'Raw'],
    notes: 'Formato reto de supervivencia con tiempo límite. Expresión facial de encierro, iluminación claustrofóbica y tipografía limpia.',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    favorite: false,
  },
];
