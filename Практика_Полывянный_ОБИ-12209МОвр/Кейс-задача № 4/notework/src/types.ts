export interface Note {
  id: string;
  title: string;
  content: string;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export type StorageMode = 'sqlite' | 'files' | 'memory';

export interface SearchQuery {
  text?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface NoteIndexEntry {
  id: string;
  title: string;
  eventDate: string;
  tags: string[];
  updatedAt: string;
}
