import * as SQLite from 'expo-sqlite';
import type { INoteRepository, NewNote } from './INoteRepository';
import type { Note, SearchQuery } from '../types';
import { uuid } from '../utils/id';
import { nowIso } from '../utils/date';

interface NoteRow {
  id: string;
  title: string;
  content: string;
  event_date: string;
  created_at: string;
  updated_at: string;
  tags: string;
}

export class SqliteNoteRepository implements INoteRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  async init(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('notework.db');
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        event_date TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]'
      );
      CREATE INDEX IF NOT EXISTS idx_notes_event_date ON notes(event_date);
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at);
    `);
  }

  private get database(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('SqliteNoteRepository.init() not called');
    return this.db;
  }

  private toDomain(row: NoteRow): Note {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      eventDate: row.event_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags: safeParseTags(row.tags),
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
    await this.database.runAsync(
      `INSERT INTO notes (id, title, content, event_date, created_at, updated_at, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [note.id, note.title, note.content, note.eventDate, note.createdAt, note.updatedAt, JSON.stringify(note.tags)],
    );
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
    await this.database.runAsync(
      `UPDATE notes SET title = ?, content = ?, event_date = ?, updated_at = ?, tags = ?
       WHERE id = ?`,
      [updated.title, updated.content, updated.eventDate, updated.updatedAt, JSON.stringify(updated.tags), id],
    );
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.database.runAsync('DELETE FROM notes WHERE id = ?', [id]);
  }

  async findById(id: string): Promise<Note | null> {
    const row = await this.database.getFirstAsync<NoteRow>(
      'SELECT * FROM notes WHERE id = ?',
      [id],
    );
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Note[]> {
    const rows = await this.database.getAllAsync<NoteRow>(
      'SELECT * FROM notes ORDER BY updated_at DESC',
    );
    return rows.map(r => this.toDomain(r));
  }

  async search(query: SearchQuery): Promise<Note[]> {
    const clauses: string[] = [];
    const params: (string | number)[] = [];

    if (query.text && query.text.trim()) {
      clauses.push('(LOWER(title) LIKE ? OR LOWER(content) LIKE ?)');
      const like = `%${query.text.toLowerCase().trim()}%`;
      params.push(like, like);
    }
    if (query.dateFrom) {
      clauses.push('event_date >= ?');
      params.push(query.dateFrom);
    }
    if (query.dateTo) {
      clauses.push('event_date <= ?');
      params.push(query.dateTo);
    }
    if (query.tags && query.tags.length) {
      query.tags.forEach(t => {
        clauses.push('tags LIKE ?');
        params.push(`%"${t}"%`);
      });
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = await this.database.getAllAsync<NoteRow>(
      `SELECT * FROM notes ${where} ORDER BY updated_at DESC`,
      params,
    );
    return rows.map(r => this.toDomain(r));
  }

  async clear(): Promise<void> {
    await this.database.execAsync('DELETE FROM notes');
  }
}

function safeParseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
