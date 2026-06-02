import { Platform } from 'react-native';
import type { INoteRepository } from './INoteRepository';
import type { StorageMode } from '../types';
import { SqliteNoteRepository } from './SqliteNoteRepository';
import { FileSystemNoteRepository } from './FileSystemNoteRepository';
import { InMemoryNoteRepository } from './InMemoryNoteRepository';

export async function createRepository(mode: StorageMode): Promise<INoteRepository> {
  let repo: INoteRepository;
  if (Platform.OS === 'web') {
    repo = new InMemoryNoteRepository();
  } else if (mode === 'sqlite') {
    repo = new SqliteNoteRepository();
  } else if (mode === 'files') {
    repo = new FileSystemNoteRepository();
  } else {
    repo = new InMemoryNoteRepository();
  }
  await repo.init();
  return repo;
}
