// src/storage/index.ts
import { apiStorage } from './apiStorage';
// future: import { localStorageImpl } from './localStorage';

export const storage = apiStorage;
// agar kabhi local pe switch karna ho:
// export const storage = localStorageImpl;
