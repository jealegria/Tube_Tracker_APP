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

export interface UserVideoPack {
  id: string;
  profileId: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserVideoFolder {
  id: string;
  profileId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export type CategoryFilter = 'Todas' | string;

export type SortOrder = 'newest' | 'oldest' | 'alpha';

export type ActiveModule =
  | 'repositorio'
  | 'misvideos'
  | 'preview'
  | 'abtesting'
  | 'datos'
  | 'settings';
