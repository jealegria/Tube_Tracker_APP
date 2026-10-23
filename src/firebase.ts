import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  onSnapshot, 
  getDocFromServer,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { PackagingItem, UserVideoFolder, UserVideoPack } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export type ProfileId = 'johnny' | 'guido';

export interface ProfileDefinition {
  id: ProfileId;
  name: string;
  shortRole: string;
  accentColor: string;
}

export const PROFILES: Record<ProfileId, ProfileDefinition> = {
  johnny: {
    id: 'johnny',
    name: 'Johnny',
    shortRole: 'Johnny',
    accentColor: 'red',
  },
  guido: {
    id: 'guido',
    name: 'Guido',
    shortRole: 'Guido',
    accentColor: 'blue',
  },
};

// SHA-256 hashes of authorized emails so plain-text addresses are never exposed in client bundles
const JOHNNY_HASH = 'd858133616da01ee7f068635a56d58372025cf99cc57335976fce329b8e712b6';
const GUIDO_HASH = '42b24ebfc3d601a578840d3ed35abc5680884eacf6f41d3c6a0f22baa182be87';

function sha256Ascii(ascii: string): string {
  const rightRotate = (value: number, amount: number) => (value >>> amount) | (value << (32 - amount));
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (let j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (let i = 0; i < 64; i++) {
      const i2 = i + j;
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
      void i2;
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

export function isEmailAuthorized(email?: string | null): boolean {
  if (!email) return false;
  const digest = sha256Ascii(email.trim().toLowerCase());
  return digest === JOHNNY_HASH || digest === GUIDO_HASH;
}

export function getDefaultProfileForEmail(email?: string | null): ProfileId {
  if (!email) return 'johnny';
  const digest = sha256Ascii(email.trim().toLowerCase());
  return digest === GUIDO_HASH ? 'guido' : 'johnny';
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

function buildPackagingPayload(profileId: ProfileId, item: PackagingItem, userId?: string) {
  const payload: Record<string, any> = {
    id: item.id,
    profileId,
    userId: userId ?? auth.currentUser?.uid ?? '',
    videoId: item.videoId,
    url: item.url,
    title: item.title.slice(0, 500),
    category: item.category.slice(0, 100),
    createdAt: item.createdAt || Date.now(),
    favorite: Boolean(item.favorite),
    tags: (item.tags || []).slice(0, 50),
  };
  if (item.channelTitle) payload.channelTitle = item.channelTitle.slice(0, 200);
  if (item.notes) payload.notes = item.notes.slice(0, 2000);
  return payload;
}

export function subscribeToProfilePackagings(
  profileId: ProfileId,
  onSuccess: (items: PackagingItem[]) => void,
  onError?: (err: unknown) => void
) {
  const colPath = `profiles/${profileId}/packagings`;
  const packagingsCol = collection(db, 'profiles', profileId, 'packagings');

  return onSnapshot(
    packagingsCol,
    (snapshot) => {
      const items: PackagingItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: data.id || docSnap.id,
          videoId: data.videoId,
          url: data.url,
          title: data.title,
          channelTitle: data.channelTitle,
          category: data.category,
          tags: Array.isArray(data.tags) ? data.tags : [],
          notes: data.notes || '',
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          favorite: Boolean(data.favorite)
        });
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      onSuccess(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, colPath);
      if (onError) onError(error);
    }
  );
}

export async function saveProfilePackaging(
  profileId: ProfileId,
  item: PackagingItem
): Promise<void> {
  const docPath = `profiles/${profileId}/packagings/${item.id}`;
  try {
    const docRef = doc(db, 'profiles', profileId, 'packagings', item.id);
    await setDoc(docRef, buildPackagingPayload(profileId, item));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteProfilePackaging(
  profileId: ProfileId,
  itemId: string
): Promise<void> {
  const docPath = `profiles/${profileId}/packagings/${itemId}`;
  try {
    await deleteDoc(doc(db, 'profiles', profileId, 'packagings', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export function subscribeToProfilePreferences(
  profileId: ProfileId,
  onSuccess: (data: {
    categories?: string[];
    tags?: string[];
    defaultChannelName?: string;
    exists: boolean;
  }) => void
) {
  const docPath = `profiles/${profileId}/config/preferences`;
  const configDoc = doc(db, 'profiles', profileId, 'config', 'preferences');

  return onSnapshot(
    configDoc,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        onSuccess({
          categories: data.categories || [],
          tags: data.tags || [],
          defaultChannelName:
            typeof data.defaultChannelName === 'string' ? data.defaultChannelName : undefined,
          exists: true,
        });
      } else {
        onSuccess({ exists: false });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  );
}

export async function saveProfilePreferences(
  profileId: ProfileId,
  categories: string[],
  tags: string[],
  defaultChannelName?: string
): Promise<void> {
  const docPath = `profiles/${profileId}/config/preferences`;
  try {
    const configDoc = doc(db, 'profiles', profileId, 'config', 'preferences');
    const payload: Record<string, any> = {
      profileId,
      userId: auth.currentUser?.uid || '',
      categories: categories.slice(0, 100),
      tags: tags.slice(0, 200),
    };
    if (typeof defaultChannelName === 'string') {
      payload.defaultChannelName = defaultChannelName.slice(0, 120);
    }
    await setDoc(configDoc, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// ==========================================
// MIS VIDEOS: Cloud Folders & Packs (up to 10 folders, 5 packs each)
// ==========================================

export function subscribeToProfileMyVideos(
  profileId: ProfileId,
  onSuccess: (folders: UserVideoFolder[]) => void,
  onError?: (err: unknown) => void
) {
  const colPath = `profiles/${profileId}/myVideos`;
  const colRef = collection(db, 'profiles', profileId, 'myVideos');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const folders: UserVideoFolder[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        folders.push({
          id: data.id || docSnap.id,
          profileId: data.profileId || profileId,
          name: data.name || 'Video sin título',
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        });
      });
      folders.sort((a, b) => a.createdAt - b.createdAt);
      onSuccess(folders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, colPath);
      if (onError) onError(error);
    }
  );
}

export async function saveProfileMyVideo(
  profileId: ProfileId,
  folder: UserVideoFolder
): Promise<void> {
  const docPath = `profiles/${profileId}/myVideos/${folder.id}`;
  try {
    const docRef = doc(db, 'profiles', profileId, 'myVideos', folder.id);
    const payload = {
      id: folder.id.slice(0, 128),
      profileId,
      userId: auth.currentUser?.uid || '',
      name: folder.name.trim().slice(0, 200) || 'Nuevo Video',
      createdAt: folder.createdAt || Date.now(),
      updatedAt: folder.updatedAt || Date.now(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteProfileMyVideo(
  profileId: ProfileId,
  videoId: string,
  packIds: string[]
): Promise<void> {
  const docPath = `profiles/${profileId}/myVideos/${videoId}`;
  try {
    const batch = writeBatch(db);
    const videoRef = doc(db, 'profiles', profileId, 'myVideos', videoId);
    batch.delete(videoRef);

    for (const pid of packIds) {
      const packRef = doc(db, 'profiles', profileId, 'myVideoPacks', pid);
      batch.delete(packRef);
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export function subscribeToProfileMyVideoPacks(
  profileId: ProfileId,
  onSuccess: (packs: UserVideoPack[]) => void,
  onError?: (err: unknown) => void
) {
  const colPath = `profiles/${profileId}/myVideoPacks`;
  const colRef = collection(db, 'profiles', profileId, 'myVideoPacks');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const packs: UserVideoPack[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        packs.push({
          id: data.id || docSnap.id,
          profileId: data.profileId || profileId,
          videoId: data.videoId,
          title: data.title || '',
          thumbnailUrl: data.thumbnailUrl || '',
          order: typeof data.order === 'number' ? data.order : 0,
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        });
      });
      packs.sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
      onSuccess(packs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, colPath);
      if (onError) onError(error);
    }
  );
}

export async function saveProfileMyVideoPack(
  profileId: ProfileId,
  pack: UserVideoPack
): Promise<void> {
  const docPath = `profiles/${profileId}/myVideoPacks/${pack.id}`;
  try {
    const docRef = doc(db, 'profiles', profileId, 'myVideoPacks', pack.id);
    const safeOrder = Math.max(0, Math.min(4, Math.floor(pack.order)));
    const payload = {
      id: pack.id.slice(0, 128),
      profileId,
      userId: auth.currentUser?.uid || '',
      videoId: pack.videoId.slice(0, 128),
      title: pack.title.trim().slice(0, 500) || 'Sin título',
      thumbnailUrl: pack.thumbnailUrl.slice(0, 450000),
      order: safeOrder,
      createdAt: pack.createdAt || Date.now(),
      updatedAt: pack.updatedAt || Date.now(),
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteProfileMyVideoPack(
  profileId: ProfileId,
  packId: string
): Promise<void> {
  const docPath = `profiles/${profileId}/myVideoPacks/${packId}`;
  try {
    await deleteDoc(doc(db, 'profiles', profileId, 'myVideoPacks', packId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function migrateItemsToProfile(
  profileId: ProfileId,
  items: PackagingItem[],
  categories: string[],
  tags: string[]
): Promise<number> {
  if (items.length === 0) return 0;

  await saveProfilePreferences(profileId, categories, tags);

  const batch = writeBatch(db);
  let count = 0;
  for (const item of items) {
    if (count >= 400) break;
    const docRef = doc(db, 'profiles', profileId, 'packagings', item.id);
    batch.set(docRef, buildPackagingPayload(profileId, item));
    count++;
  }

  await batch.commit();
  return count;
}

export async function checkAndMigrateLegacyUserCollection(
  userId: string,
  profileId: ProfileId
): Promise<number> {
  try {
    const legacyCol = collection(db, 'users', userId, 'packagings');
    const legacySnap = await getDocs(legacyCol);
    if (legacySnap.empty) return 0;

    const batch = writeBatch(db);
    let count = 0;
    legacySnap.forEach((docSnap) => {
      if (count >= 400) return;
      const data = docSnap.data();
      const item: PackagingItem = {
        id: data.id || docSnap.id,
        videoId: data.videoId,
        url: data.url,
        title: data.title,
        channelTitle: data.channelTitle,
        category: data.category,
        tags: Array.isArray(data.tags) ? data.tags : [],
        notes: data.notes || '',
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        favorite: Boolean(data.favorite),
      };
      const docRef = doc(db, 'profiles', profileId, 'packagings', item.id);
      batch.set(docRef, buildPackagingPayload(profileId, item, userId));
      count++;
    });

    if (count === 0) return 0;
    await batch.commit();
    return count;
  } catch {
    return 0;
  }
}
