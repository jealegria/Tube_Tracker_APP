import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { PackagingItem } from '../types';
import { DEFAULT_TAGS, INITIAL_SAMPLE_PACKAGINGS } from '../utils/youtube';
import { parseShareUrl } from '../utils/shareUrl';
import {
  auth,
  ProfileId,
  PROFILES,
  isEmailAuthorized,
  getDefaultProfileForEmail,
  subscribeToProfilePackagings,
  saveProfilePackaging,
  deleteProfilePackaging,
  subscribeToProfilePreferences,
  saveProfilePreferences,
  migrateItemsToProfile,
  checkAndMigrateLegacyUserCollection,
} from '../firebase';

const getStorageKey = (profileId: ProfileId) => `tubeswipe_packagings_${profileId}_v1`;
const getCategoriesKey = (profileId: ProfileId) => `tubeswipe_categories_${profileId}_v1`;
const getTagsKey = (profileId: ProfileId) => `tubeswipe_tags_${profileId}_v1`;
const getChannelKey = (profileId: ProfileId) => `tubeswipe_channel_${profileId}_v1`;

const LEGACY_STORAGE_KEY = 'tubeswipe_packagings_v3';
const LEGACY_CATEGORIES_KEY = 'tubeswipe_categories_v1';
const LEGACY_TAGS_KEY = 'tubeswipe_tags_v1';

const getFallbackChannelForProfile = (profileId: ProfileId) =>
  profileId === 'johnny' ? 'Johnny BT' : '';

export function useProfileWorkspace() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState<ProfileId>('johnny');
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  const [packagings, setPackagings] = useState<PackagingItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['Ideas', 'Formatos']);
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS);
  const [defaultChannelName, setDefaultChannelName] = useState<string>('Johnny BT');

  const [sharedBannerCount, setSharedBannerCount] = useState<number | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const hasCheckedLegacyRef = useRef<Record<string, boolean>>({});
  const isAuthorized = Boolean(user && isEmailAuthorized(user.email));
  const ownProfile: ProfileId = getDefaultProfileForEmail(user?.email);

  const showTempBanner = (msg: string, ms = 3500) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), ms);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && isEmailAuthorized(currentUser.email)) {
        setActiveProfile(getDefaultProfileForEmail(currentUser.email));
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    const sharedData = parseShareUrl();
    if (sharedData && sharedData.items.length > 0) {
      setPackagings(sharedData.items);
      if (sharedData.tags.length > 0) {
        setTags((prev) => Array.from(new Set([...prev, ...sharedData.tags])));
      }
      setSharedBannerCount(sharedData.items.length);
      if (window.history?.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!user || !isAuthorized) return;

    setIsCloudSyncing(true);

    const loadLocalProfileFallback = (prof: ProfileId): PackagingItem[] => {
      try {
        const saved = localStorage.getItem(getStorageKey(prof));
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        if (prof === 'johnny') {
          const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacySaved) {
            const parsedLegacy = JSON.parse(legacySaved);
            if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) return parsedLegacy;
          }
        }
      } catch {
        // Ignore storage errors
      }
      return INITIAL_SAMPLE_PACKAGINGS;
    };

    const loadLocalCategoriesFallback = (prof: ProfileId): string[] => {
      try {
        const saved = localStorage.getItem(getCategoriesKey(prof));
        if (saved) return JSON.parse(saved);
        if (prof === 'johnny') {
          const legacy = localStorage.getItem(LEGACY_CATEGORIES_KEY);
          if (legacy) return JSON.parse(legacy);
        }
      } catch {
        // Ignore storage errors
      }
      return ['Ideas', 'Formatos'];
    };

    const loadLocalTagsFallback = (prof: ProfileId): string[] => {
      try {
        const saved = localStorage.getItem(getTagsKey(prof));
        if (saved) return JSON.parse(saved);
        if (prof === 'johnny') {
          const legacy = localStorage.getItem(LEGACY_TAGS_KEY);
          if (legacy) return JSON.parse(legacy);
        }
      } catch {
        // Ignore storage errors
      }
      return DEFAULT_TAGS;
    };

    const loadLocalChannelFallback = (prof: ProfileId): string => {
      try {
        const saved = localStorage.getItem(getChannelKey(prof));
        if (saved !== null) return saved;
      } catch {
        // Ignore storage errors
      }
      return getFallbackChannelForProfile(prof);
    };

    const unsubPackagings = subscribeToProfilePackagings(
      activeProfile,
      async (cloudItems) => {
        if (cloudItems.length > 0) {
          setPackagings(cloudItems);
          setIsCloudSyncing(false);
          return;
        }

        const checkKey = `${user.uid}_${activeProfile}`;
        if (!hasCheckedLegacyRef.current[checkKey]) {
          hasCheckedLegacyRef.current[checkKey] = true;

          if (activeProfile === ownProfile) {
            const migratedCount = await checkAndMigrateLegacyUserCollection(user.uid, activeProfile);
            if (migratedCount > 0) {
              setIsCloudSyncing(false);
              return;
            }
          }

          const localFallback = loadLocalProfileFallback(activeProfile);
          const localCats = loadLocalCategoriesFallback(activeProfile);
          const localTags = loadLocalTagsFallback(activeProfile);

          setPackagings(localFallback);
          if (localFallback.length > 0) {
            await migrateItemsToProfile(activeProfile, localFallback, localCats, localTags);
          }
        } else {
          setPackagings([]);
        }
        setIsCloudSyncing(false);
      },
      () => setIsCloudSyncing(false)
    );

    const unsubPrefs = subscribeToProfilePreferences(activeProfile, (prefs) => {
      if (prefs.exists) {
        if (prefs.categories && prefs.categories.length > 0) setCategories(prefs.categories);
        if (prefs.tags && prefs.tags.length > 0) setTags(prefs.tags);
        if (typeof prefs.defaultChannelName === 'string') {
          setDefaultChannelName(prefs.defaultChannelName);
        } else {
          setDefaultChannelName(loadLocalChannelFallback(activeProfile));
        }
      } else {
        setCategories(loadLocalCategoriesFallback(activeProfile));
        setTags(loadLocalTagsFallback(activeProfile));
        setDefaultChannelName(loadLocalChannelFallback(activeProfile));
      }
    });

    return () => {
      unsubPackagings();
      unsubPrefs();
    };
  }, [user, isAuthorized, activeProfile, ownProfile]);

  useEffect(() => {
    if (!isAuthorized) return;
    localStorage.setItem(getStorageKey(activeProfile), JSON.stringify(packagings));
  }, [packagings, activeProfile, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    localStorage.setItem(getCategoriesKey(activeProfile), JSON.stringify(categories));
  }, [categories, activeProfile, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    localStorage.setItem(getTagsKey(activeProfile), JSON.stringify(tags));
  }, [tags, activeProfile, isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;
    localStorage.setItem(getChannelKey(activeProfile), defaultChannelName);
  }, [defaultChannelName, activeProfile, isAuthorized]);

  const addPackaging = async (newItem: PackagingItem) => {
    setPackagings((prev) => [newItem, ...prev]);
    if (user && isAuthorized) {
      await saveProfilePackaging(activeProfile, newItem);
    }
  };

  const updateCategory = (id: string, newCat: string) => {
    setPackagings((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, category: newCat };
          if (user && isAuthorized) saveProfilePackaging(activeProfile, updated);
          return updated;
        }
        return item;
      })
    );
  };

  const updateTags = (id: string, newTags: string[]) => {
    setPackagings((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, tags: newTags };
          if (user && isAuthorized) saveProfilePackaging(activeProfile, updated);
          return updated;
        }
        return item;
      })
    );
  };

  const updateNotes = (id: string, newNotes: string) => {
    setPackagings((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, notes: newNotes };
          if (user && isAuthorized) saveProfilePackaging(activeProfile, updated);
          return updated;
        }
        return item;
      })
    );
  };

  const updateTitle = (id: string, newTitle: string) => {
    setPackagings((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, title: newTitle };
          if (user && isAuthorized) saveProfilePackaging(activeProfile, updated);
          return updated;
        }
        return item;
      })
    );
  };

  const toggleFavorite = (id: string) => {
    setPackagings((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, favorite: !item.favorite };
          if (user && isAuthorized) saveProfilePackaging(activeProfile, updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteItem = (id: string) => {
    setPackagings((prev) => prev.filter((item) => item.id !== id));
    if (user && isAuthorized) {
      deleteProfilePackaging(activeProfile, id);
    }
  };

  const createCategory = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return false;

    const updatedCats = [...categories, trimmed];
    setCategories(updatedCats);
    if (user && isAuthorized) {
      saveProfilePreferences(activeProfile, updatedCats, tags, defaultChannelName);
    }
    return true;
  };

  const deleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) return;
    const fallbackCat = categories.find((c) => c !== catToDelete) || 'Ideas';
    const updatedCats = categories.filter((c) => c !== catToDelete);

    setPackagings((prev) =>
      prev.map((item) => {
        if (item.category === catToDelete) {
          const updated = { ...item, category: fallbackCat };
          if (user && isAuthorized) saveProfilePackaging(activeProfile, updated);
          return updated;
        }
        return item;
      })
    );
    setCategories(updatedCats);
    if (user && isAuthorized) {
      saveProfilePreferences(activeProfile, updatedCats, tags, defaultChannelName);
    }
  };

  const addTag = (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed || tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    const updatedTags = [...tags, trimmed];
    setTags(updatedTags);
    if (user && isAuthorized) {
      saveProfilePreferences(activeProfile, categories, updatedTags, defaultChannelName);
    }
  };

  const editTag = (oldName: string, newName: string) => {
    const updatedTags = tags.map((t) => (t === oldName ? newName : t));
    setTags(updatedTags);
    if (user && isAuthorized) {
      saveProfilePreferences(activeProfile, categories, updatedTags, defaultChannelName);
    }
    setPackagings((prev) =>
      prev.map((item) => {
        if (item.tags?.includes(oldName)) {
          const updated = {
            ...item,
            tags: item.tags.map((t) => (t === oldName ? newName : t)),
          };
          if (user && isAuthorized) saveProfilePackaging(activeProfile, updated);
          return updated;
        }
        return item;
      })
    );
  };

  const deleteTag = (tagName: string) => {
    const updatedTags = tags.filter((t) => t !== tagName);
    setTags(updatedTags);
    if (user && isAuthorized) {
      saveProfilePreferences(activeProfile, categories, updatedTags, defaultChannelName);
    }
    setPackagings((prev) =>
      prev.map((item) => {
        if (item.tags?.includes(tagName)) {
          const updated = {
            ...item,
            tags: item.tags.filter((t) => t !== tagName),
          };
          if (user && isAuthorized) saveProfilePackaging(activeProfile, updated);
          return updated;
        }
        return item;
      })
    );
  };

  const updateDefaultChannelName = async (newName: string) => {
    const trimmed = newName.trim().slice(0, 120);
    setDefaultChannelName(trimmed);
    if (user && isAuthorized) {
      await saveProfilePreferences(activeProfile, categories, tags, trimmed);
    }
  };

  const importItems = async (importedItems: PackagingItem[]) => {
    const existingIds = new Set(packagings.map((p) => p.videoId));
    const uniqueNew = importedItems.filter((p) => !existingIds.has(p.videoId));
    const combined = [...uniqueNew, ...packagings];
    setPackagings(combined);

    const importedCategories = Array.from(new Set(importedItems.map((i) => i.category)));
    const newCats = Array.from(new Set([...categories, ...importedCategories]));
    setCategories(newCats);

    const importedTags = Array.from(new Set(importedItems.flatMap((i) => i.tags || [])));
    const newTagsList = Array.from(new Set([...tags, ...importedTags]));
    setTags(newTagsList);

    if (user && isAuthorized) {
      await migrateItemsToProfile(activeProfile, uniqueNew, newCats, newTagsList);
    }

    showTempBanner(
      `Se importaron ${uniqueNew.length} packagings nuevos en el perfil de ${PROFILES[activeProfile].name}.`
    );
  };

  const resetToSamples = async () => {
    setPackagings(INITIAL_SAMPLE_PACKAGINGS);
    if (user && isAuthorized) {
      await migrateItemsToProfile(activeProfile, INITIAL_SAMPLE_PACKAGINGS, categories, tags);
    }
    showTempBanner(`Se restauraron los packagings de ejemplo en ${PROFILES[activeProfile].name}.`);
  };

  const clearAll = async () => {
    const oldItems = [...packagings];
    setPackagings([]);
    if (user && isAuthorized) {
      for (const item of oldItems) {
        await deleteProfilePackaging(activeProfile, item.id);
      }
    }
  };

  const migrateLocalToCloud = async () => {
    if (!user || !isAuthorized) return;
    setIsCloudSyncing(true);
    try {
      const count = await migrateItemsToProfile(activeProfile, packagings, categories, tags);
      showTempBanner(`Sincronización completa: ${count} packagings respaldados en ${PROFILES[activeProfile].name}.`);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  return {
    user,
    authLoading,
    isAuthorized,
    activeProfile,
    setActiveProfile,
    ownProfile,
    isCloudSyncing,
    packagings,
    categories,
    tags,
    defaultChannelName,
    updateDefaultChannelName,
    sharedBannerCount,
    setSharedBannerCount,
    statusBanner,
    setStatusBanner,
    addPackaging,
    updateCategory,
    updateTags,
    updateNotes,
    updateTitle,
    toggleFavorite,
    deleteItem,
    createCategory,
    deleteCategory,
    addTag,
    editTag,
    deleteTag,
    importItems,
    resetToSamples,
    clearAll,
    migrateLocalToCloud,
  };
}
