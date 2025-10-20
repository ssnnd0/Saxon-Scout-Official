// Helper functions for interacting with the File System Access API. The scouting
// application stores all data locally on the user's device by writing JSON
// directly into a user‑selected directory. These helpers abstract away
// directory creation and JSON writing. If the File System Access API is not
// supported, a fully functional fallback to in-browser storage is provided.

// A minimal interface we rely on for directory and file handles
export interface DirLike {
  getDirectoryHandle(name: string, opts: { create?: boolean }): Promise<DirLike>;
  getFileHandle(name: string, opts: { create?: boolean }): Promise<FileLike>;
}

export interface FileLike {
  createWritable(): Promise<{ write(data: Blob | string | ArrayBuffer): Promise<void>; close(): Promise<void> }>;
}

export type DirHandle = (FileSystemDirectoryHandle & DirLike) | DirLike;

const FALLBACK_STORAGE_PREFIX = 'saxon_scout_fs/';

// ----------------------------------------------------------------------------
// Fallback implementation using localStorage (simple, available everywhere)
// ----------------------------------------------------------------------------

class LocalFileHandle implements FileLike {
  private key: string;
  private buffer: string = '';

  constructor(key: string) {
    this.key = key;
  }

  async createWritable() {
    const self = this;
    return {
      async write(data: Blob | string | ArrayBuffer) {
        if (data instanceof Blob) {
          self.buffer = await data.text();
        } else if (typeof data === 'string') {
          self.buffer = data;
        } else if (data instanceof ArrayBuffer) {
          self.buffer = new TextDecoder().decode(new Uint8Array(data));
        } else {
          self.buffer = String(data as any);
        }
      },
      async close() {
        try {
          localStorage.setItem(self.key, self.buffer);
        } finally {
          self.buffer = '';
        }
      }
    };
  }
}

class LocalDir implements DirLike {
  private path: string; // e.g. '' or 'matches/'

  constructor(path: string = '') {
    this.path = path.endsWith('/') || path === '' ? path : path + '/';
  }

  async getDirectoryHandle(name: string, _opts: { create?: boolean }): Promise<DirLike> {
    return new LocalDir(this.path + name + '/');
  }

  async getFileHandle(name: string, _opts: { create?: boolean }): Promise<FileLike> {
    const key = FALLBACK_STORAGE_PREFIX + this.path + name;
    return new LocalFileHandle(key);
  }
}

function isNativeFSAvailable(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window && window.isSecureContext;
}

/**
 * Prompts the user to select a root directory for storing scouting data. The
 * directory must contain the required subdirectories (`matches`, `pit`,
 * `exports`, `logs`). If they do not exist, they are created automatically.
 * If the File System Access API is not available (e.g., in iframes or non-secure
 * contexts), a localStorage-backed directory is returned instead.
 */
export async function pickRoot(): Promise<DirHandle> {
  if (isNativeFSAvailable()) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker();
    // Ensure required subfolders exist
    for (const folder of ['matches', 'pit', 'exports', 'logs']) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await (handle as any).getDirectoryHandle(folder, { create: true });
    }
    return handle as unknown as DirHandle;
  }

  // Fallback to localStorage-backed virtual directory
  const root = new LocalDir('');
  for (const folder of ['matches', 'pit', 'exports', 'logs']) {
    await root.getDirectoryHandle(folder, { create: true });
  }
  return root;
}

/**
 * Writes an arbitrary JavaScript value to a JSON file. The path is resolved
 * relative to the provided root directory. Intermediate folders are created
 * as needed. The resulting file is pretty printed for ease of inspection.
 */
export async function writeJSON(dir: DirHandle, relPath: string, data: unknown) {
  const parts = relPath.split('/');
  let current: DirLike = dir as DirLike;
  for (let i = 0; i < parts.length - 1; i++) {
    current = await current.getDirectoryHandle(parts[i], { create: true });
  }
  const fileHandle = await current.getFileHandle(parts[parts.length - 1], { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  await writable.close();
}
