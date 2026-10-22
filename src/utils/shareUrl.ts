import { PackagingItem } from '../types';
import { extractYouTubeId, getCanonicalWatchUrl } from './youtube';

interface SharedPayload {
  items: Array<{
    v: string;
    t: string;
    c?: string;
    cat: string;
    tags?: string[];
    n?: string;
    fav?: number;
  }>;
  tags?: string[];
}

export function getPublicAppUrl(): string {
  const origin = window.location.origin.replace(/^https:\/\/ais-dev-/, 'https://ais-pre-');
  return origin + window.location.pathname;
}

export function generateShareUrl(items: PackagingItem[], tags: string[]): string {
  try {
    const payload: SharedPayload = {
      items: items.map((i) => ({
        v: i.videoId,
        t: i.title,
        c: i.channelTitle || '',
        cat: i.category,
        tags: i.tags && i.tags.length > 0 ? i.tags : undefined,
        n: i.notes || undefined,
        fav: i.favorite ? 1 : 0,
      })),
      tags,
    };

    const jsonStr = JSON.stringify(payload);
    const base64 = btoa(
      encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );

    const baseUrl = getPublicAppUrl();
    return `${baseUrl}#share=${base64}`;
  } catch {
    return getPublicAppUrl();
  }
}

export function parseShareUrl(): { items: PackagingItem[]; tags: string[] } | null {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('share=')) return null;

    const rawBase64 = hash.slice(hash.indexOf('share=') + 6);
    if (!rawBase64 || rawBase64.length > 250000) return null;

    const cleanBase64 = decodeURIComponent(rawBase64);
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(cleanBase64), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const data: SharedPayload = JSON.parse(jsonStr);
    if (!data || !Array.isArray(data.items)) return null;

    const items: PackagingItem[] = [];
    for (let idx = 0; idx < Math.min(data.items.length, 200); idx++) {
      const raw = data.items[idx];
      if (!raw || typeof raw !== 'object') continue;
      const validVideoId = extractYouTubeId(String(raw.v || ''));
      if (!validVideoId) continue;

      items.push({
        id: `shared_${Date.now()}_${idx}`,
        videoId: validVideoId,
        url: getCanonicalWatchUrl(validVideoId),
        title: String(raw.t || '').slice(0, 300),
        channelTitle: String(raw.c || 'Canal de YouTube').slice(0, 150),
        category: String(raw.cat || 'Ideas').slice(0, 80),
        tags: Array.isArray(raw.tags)
          ? raw.tags
              .slice(0, 30)
              .map((t) => String(t || '').slice(0, 60))
              .filter(Boolean)
          : [],
        notes: raw.n ? String(raw.n).slice(0, 1500) : undefined,
        createdAt: Date.now() - idx * 1000,
        favorite: raw.fav === 1,
      });
    }

    const safeTags = Array.isArray(data.tags)
      ? data.tags
          .slice(0, 100)
          .map((t) => String(t || '').slice(0, 60))
          .filter(Boolean)
      : [];

    return {
      items,
      tags: safeTags,
    };
  } catch {
    return null;
  }
}
