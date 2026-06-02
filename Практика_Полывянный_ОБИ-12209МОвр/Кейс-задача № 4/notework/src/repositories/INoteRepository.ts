import type { Note, SearchQuery } from '../types';

export type NewNote = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

export interface INoteRepository {
  init(): Promise<void>;
  create(note: NewNote): Promise<Note>;
  update(id: string, patch: Partial<NewNote>): Promise<Note>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<Note | null>;
  findAll(): Promise<Note[]>;
  search(query: SearchQuery): Promise<Note[]>;
  clear(): Promise<void>;
}
