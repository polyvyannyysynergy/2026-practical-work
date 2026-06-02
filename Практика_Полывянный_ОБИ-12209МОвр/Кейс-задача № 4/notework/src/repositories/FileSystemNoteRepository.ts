import { Directory, File, Paths } from 'expo-file-system';
import type { INoteRepository, NewNote } from './INoteRepository';
import type { Note, NoteIndexEntry, SearchQuery } from '../types';
import { uuid } from '../utils/id';
import { nowIso } from '../utils/date';

const DIR_NAME = 'notes';
const INDEX_FILE = 'index.json';

export class FileSystemNoteRepository implements INoteRepository {
  private dir: Directory | null = null;
  private indexFile: File | null = null;

  async init(): Promise<void> {
    this.dir = new Directory(Paths.document, DIR_NAME);
    if (!this.dir.exists) this.dir.create({ intermediates: true });
    this.indexFile = new File(this.dir, INDEX_FILE);
    if (!this.indexFile.exists) {
      this.indexFile.create();
      this.indexFile.write(JSON.stringify([]));
    }
  }

  private noteFile(id: string): File {
    if (!this.dir) throw new Error('FileSystemNoteRepository.init() not called');
    return new File(this.dir, `${id}.json`);
  }

  private async readIndex(): Promise<NoteIndexEntry[]> {
    if (!this.indexFile) throw new Error('FileSystemNoteRepository.init() not called');
    try {
      const raw = await this.indexFile.text();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async writeIndex(entries: NoteIndexEntry[]): Promise<void> {
    if (!this.indexFile) throw new Error('FileSystemNoteRepository.init() not called');
    this.indexFile.write(JSON.stringify(entries));
  }

  private toIndexEntry(note: Note): NoteIndexEntry {
    return {
      id: note.id,
      title: note.title,
      eventDate: note.eventDate,
      tags: note.tags,
      updatedAt: note.updatedAt,
    };
  }

  async create(input: NewNote): Promise<Note> {
    const now = nowIso();
    const note: Note = {
      id: uuid(),
      title: input.title,
      content: input.content,
      eventDate: input.eventDate,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    };
    const file = this.noteFile(note.id);
    file.create();
    file.write(JSON.stringify(note, null, 2));
    const index = await this.readIndex();
    index.unshift(this.toIndexEntry(note));
    await this.writeIndex(index);
    return note;
  }

  async update(id: string, patch: Partial<NewNote>): Promise<Note> {
    const current = await this.findById(id);
    if (!current) throw new Error(`Note ${id} not found`);
    const updated: Note = {
      ...current,
      ...patch,
      tags: patch.tags ?? current.tags,
      updatedAt: nowIso(),
    };
    this.noteFile(id).write(JSON.stringify(updated, null, 2));
    const index = await this.readIndex();
    const next = index.filter(e => e.id !== id);
    next.unshift(this.toIndexEntry(updated));
    await this.writeIndex(next);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const file = this.noteFile(id);
    if (file.exists) file.delete();
    const index = await this.readIndex();
    await this.writeIndex(index.filter(e => e.id !== id));
  }

  async findById(id: string): Promise<Note | null> {
    const file = this.noteFile(id);
    if (!file.exists) return null;
    try {
      return JSON.parse(await file.text()) as Note;
    } catch {
      return null;
    }
  }

  async findAll(): Promise<Note[]> {
    const index = await this.readIndex();
    const notes = await Promise.all(index.map(e => this.findById(e.id)));
    return notes
      .filter((n): n is Note => n !== null)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async search(query: SearchQuery): Promise<Note[]> {
    const index = await this.readIndex();
    const filtered = index.filter(e => {
      if (query.dateFrom && e.eventDate < query.dateFrom) return false;
      if (query.dateTo && e.eventDate > query.dateTo) return false;
      if (query.tags && query.tags.length) {
        const hasAll = query.tags.every(t => e.tags.includes(t));
        if (!hasAll) return false;
      }
      return true;
    });

    const notes = (await Promise.all(filtered.map(e => this.findById(e.id))))
      .filter((n): n is Note => n !== null);

    const text = query.text?.toLowerCase().trim();
    return notes
      .filter(n => !text ||
        n.title.toLowerCase().includes(text) ||
        n.content.toLowerCase().includes(text))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async clear(): Promise<void> {
    const index = await this.readIndex();
    for (const entry of index) {
      const file = this.noteFile(entry.id);
      if (file.exists) file.delete();
    }
    await this.writeIndex([]);
  }
}
