import type { INoteRepository, NewNote } from './INoteRepository';
import type { Note, SearchQuery } from '../types';
import { uuid } from '../utils/id';
import { nowIso } from '../utils/date';

export class InMemoryNoteRepository implements INoteRepository {
  private store = new Map<string, Note>();

  async init(): Promise<void> {}

  async create(input: NewNote): Promise<Note> {
    const now = nowIso();
    const note: Note = {
      id: uuid(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(note.id, note);
    return note;
  }

  async update(id: string, patch: Partial<NewNote>): Promise<Note> {
    const current = this.store.get(id);
    if (!current) throw new Error(`Note ${id} not found`);
    const updated: Note = {
      ...current,
      ...patch,
      tags: patch.tags ?? current.tags,
      updatedAt: nowIso(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.store.delete(id);
  }

  async findById(id: string): Promise<Note | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<Note[]> {
    return [...this.store.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async search(query: SearchQuery): Promise<Note[]> {
    const text = query.text?.toLowerCase().trim();
    return (await this.findAll()).filter(n => {
      if (text && !n.title.toLowerCase().includes(text) && !n.content.toLowerCase().includes(text)) {
        return false;
      }
      if (query.dateFrom && n.eventDate < query.dateFrom) return false;
      if (query.dateTo && n.eventDate > query.dateTo) return false;
      if (query.tags && query.tags.length && !query.tags.every(t => n.tags.includes(t))) return false;
      return true;
    });
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
