import { PackagingItem } from '../../types';

export interface UserDraftPack {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  viewsLabel: string;
  timeAgoLabel: string;
}

export type FeedEntry =
  | { kind: 'user'; data: UserDraftPack }
  | {
      kind: 'repo';
      data: PackagingItem;
      duration: string;
      viewsLabel: string;
      timeAgoLabel: string;
    };

const SAMPLE_DURATIONS = ['10:24', '14:08', '08:52', '18:35', '12:19', '16:40', '21:15', '09:47'];
const SAMPLE_VIEWS = ['84K views', '142K views', '310K views', '56K views', '520K views', '195K views', '73K views'];
const SAMPLE_TIMES = ['2 hours ago', '1 day ago', '3 days ago', '5 days ago', '2 weeks ago', '1 month ago'];

export function fisherYatesShuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getDeterministicMeta(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(hash);
  return {
    duration: SAMPLE_DURATIONS[abs % SAMPLE_DURATIONS.length],
    viewsLabel: SAMPLE_VIEWS[(abs >> 3) % SAMPLE_VIEWS.length],
    timeAgoLabel: SAMPLE_TIMES[(abs >> 6) % SAMPLE_TIMES.length],
  };
}
