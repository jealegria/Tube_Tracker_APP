export interface PackagingItem {
  id: string;
  videoId: string;
  url: string;
  title: string;
  channelTitle?: string;
  category: string;
  tags?: string[];
  notes?: string;
  createdAt: number;
  favorite?: boolean;
}

export type CategoryFilter = 'Todas' | string;

export type SortOrder = 'newest' | 'oldest' | 'alpha';

export type ActiveModule = 'repositorio' | 'preview' | 'abtesting' | 'datos' | 'settings';
