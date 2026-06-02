import type { INoteRepository } from './INoteRepository';
import type { StorageMode } from '../types';
import { InMemoryNoteRepository } from './InMemoryNoteRepository';

export async function createRepository(_mode: StorageMode): Promise<INoteRepository> {
  const repo = new InMemoryNoteRepository();
  await repo.init();
  return repo;
}
