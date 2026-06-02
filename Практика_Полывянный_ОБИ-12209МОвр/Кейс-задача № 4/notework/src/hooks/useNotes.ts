import { useCallback, useEffect, useState } from 'react';
import type { Note, SearchQuery } from '../types';
import { useStorage } from '../context/StorageContext';

const EMPTY: SearchQuery = {};

export function useNotes() {
  const { repo, ready, mode } = useStorage();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!repo) return;
    setLoading(true);
    try {
      const all = await repo.findAll();
      setNotes(all);
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    if (ready) void refresh();
  }, [ready, mode, refresh]);

  const remove = useCallback(async (id: string) => {
    if (!repo) return;
    await repo.remove(id);
    await refresh();
  }, [repo, refresh]);

  const query = useCallback(async (q: SearchQuery = EMPTY) => {
    if (!repo) return;
    const hasFilters = !!(q.text?.trim() || q.dateFrom || q.dateTo || q.tags?.length);
    if (!hasFilters) {
      await refresh();
      return;
    }
    setLoading(true);
    try {
      const result = await repo.search(q);
      setNotes(result);
    } finally {
      setLoading(false);
    }
  }, [repo, refresh]);

  return { notes, loading, refresh, remove, query };
}
