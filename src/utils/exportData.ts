import { PackagingItem } from '../types';
import { ProfileId } from '../firebase';

export interface EnrichedPackagingRecord {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  category: string;
  tags: string[];
  favorite: boolean;
  notes: string;
  url: string;
  thumbnailMaxResUrl: string;
  thumbnailHqUrl: string;
  createdAt: number;
  createdAtISO: string;
}

export function buildEnrichedRecords(items: PackagingItem[]): EnrichedPackagingRecord[] {
  return items.map((item) => ({
    id: item.id,
    videoId: item.videoId,
    title: item.title,
    channelTitle: item.channelTitle || '',
    category: item.category,
    tags: item.tags || [],
    favorite: Boolean(item.favorite),
    notes: item.notes || '',
    url: item.url,
    thumbnailMaxResUrl: `https://img.youtube.com/vi/${item.videoId}/maxresdefault.jpg`,
    thumbnailHqUrl: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
    createdAt: item.createdAt,
    createdAtISO: new Date(item.createdAt).toISOString(),
  }));
}

export function exportDatabaseToJson(
  activeProfile: ProfileId,
  profileName: string,
  records: EnrichedPackagingRecord[],
  categories: string[],
  tags: string[]
) {
  const payload = {
    app: 'Tube Stacker',
    profile: activeProfile,
    profileName,
    exportedAt: new Date().toISOString(),
    totalItems: records.length,
    categories,
    tags,
    items: records,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tubestacker_${activeProfile}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportDatabaseToCsv(
  activeProfile: ProfileId,
  records: EnrichedPackagingRecord[]
) {
  const escapeCsvField = (val: string | number | boolean) => {
    const str = String(val ?? '');
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'id',
    'videoId',
    'title',
    'channelTitle',
    'category',
    'tags',
    'favorite',
    'notes',
    'youtubeUrl',
    'thumbnailMaxResUrl',
    'thumbnailHqUrl',
    'createdAtISO',
  ];

  const rows = records.map((item) =>
    [
      item.id,
      item.videoId,
      item.title,
      item.channelTitle,
      item.category,
      item.tags.join('; '),
      item.favorite ? 'true' : 'false',
      item.notes,
      item.url,
      item.thumbnailMaxResUrl,
      item.thumbnailHqUrl,
      item.createdAtISO,
    ]
      .map(escapeCsvField)
      .join(',')
  );

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `tubestacker_${activeProfile}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
