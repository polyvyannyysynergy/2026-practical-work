import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { INoteRepository } from '../repositories/INoteRepository';
import { createRepository } from '../repositories/factory';
import type { Note, StorageMode } from '../types';

const MODE_KEY = 'notework.storageMode';

interface StorageContextValue {
  mode: StorageMode;
  ready: boolean;
  repo: INoteRepository | null;
  setMode: (mode: StorageMode, migrate: boolean) => Promise<void>;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export const StorageProvider: React.FC<{ children: React.ReactNode; defaultMode?: StorageMode }> = ({
  children,
  defaultMode = 'sqlite',
}) => {
  const [mode, setModeState] = useState<StorageMode>(defaultMode);
  const [ready, setReady] = useState(false);
  const repoRef = useRef<INoteRepository | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(MODE_KEY);
        const initial = (saved as StorageMode) || defaultMode;
        repoRef.current = await createRepository(initial);
        setModeState(initial);
      } catch (e) {
        repoRef.current = await createRepository(defaultMode);
      } finally {
        setReady(true);
        force(x => x + 1);
      }
    })();
  }, [defaultMode]);

  const setMode = useCallback(async (next: StorageMode, migrate: boolean) => {
    const current = repoRef.current;
    let existing: Note[] = [];
    if (migrate && current) {
      existing = await current.findAll();
    }
    const nextRepo = await createRepository(next);
    if (migrate && existing.length) {
      await nextRepo.clear();
      for (const note of existing) {
        await nextRepo.create({
          title: note.title,
          content: note.content,
          eventDate: note.eventDate,
          tags: note.tags,
        });
      }
    }
    repoRef.current = nextRepo;
    setModeState(next);
    try {
      await AsyncStorage.setItem(MODE_KEY, next);
    } catch {}
    force(x => x + 1);
  }, []);

  const value = useMemo<StorageContextValue>(
    () => ({ mode, ready, repo: repoRef.current, setMode }),
    [mode, ready, setMode, ready && repoRef.current],
  );

  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
};

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within StorageProvider');
  return ctx;
}
