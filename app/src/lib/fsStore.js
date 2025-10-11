// Helper functions for interacting with the File System Access API. The scouting
// application stores all data locally on the user's device by writing JSON
// directly into a user‑selected directory. These helpers abstract away
// directory creation and JSON writing. If the File System Access API is not
// supported, a fallback (e.g. to IndexedDB) could be added in the future.
/**
 * Prompts the user to select a root directory for storing scouting data. The
 * directory must contain the required subdirectories (`matches`, `pit`,
 * `exports`, `logs`). If they do not exist, they are created automatically.
 */
export async function pickRoot() {
    // `showDirectoryPicker` is currently only available in Chromium‑based
    // browsers. TypeScript isn't aware of this method by default, so we cast
    // through `any` to avoid type errors.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const handle = await window.showDirectoryPicker();
    // Ensure required subfolders exist
    for (const folder of ['matches', 'pit', 'exports', 'logs']) {
        await handle.getDirectoryHandle(folder, { create: true });
    }
    return handle;
}
/**
 * Writes an arbitrary JavaScript value to a JSON file on disk. The path is
 * resolved relative to the provided root directory. Intermediate folders are
 * created as needed. The resulting file is pretty printed for ease of
 * inspection.
 *
 * @param dir The root directory handle
 * @param relPath The relative path (e.g. `matches/foo.json`)
 * @param data The data to serialise into JSON
 */
export async function writeJSON(dir, relPath, data) {
    const parts = relPath.split('/');
    let current = dir;
    for (let i = 0; i < parts.length - 1; i++) {
        current = await current.getDirectoryHandle(parts[i], { create: true });
    }
    const fileHandle = await current.getFileHandle(parts[parts.length - 1], { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    await writable.close();
}
