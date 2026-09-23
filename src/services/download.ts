import { ExportFormat } from '../types/recording';

export interface SaveFileOptions {
  blob: Blob;
  filename: string;
  format: ExportFormat;
  folder?: string;
  promptFolder?: boolean;
  directoryHandle?: FileSystemDirectoryHandle | null;
}

export const FORMAT_MIME_MAP: Record<ExportFormat, string> = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
};

export const FORMAT_CONFIG: Record<
  ExportFormat,
  { label: string; desc: string; ext: string; badge: string; notice?: string }
> = {
  webm: {
    label: 'WebM Video',
    desc: 'Native browser recording — instant export, works in Chrome, VLC, YouTube & Discord',
    ext: 'webm',
    badge: 'Recommended',
  },
  mp4: {
    label: 'MP4 Video',
    desc: 'Universal video container (Use VLC or IINA on Mac if encoded with WebM)',
    ext: 'mp4',
    badge: 'Universal',
    notice: 'QuickTime Player on Mac requires Apple H.264/AAC. If QuickTime shows an error, open with VLC or IINA player.',
  },
  mkv: {
    label: 'MKV Video',
    desc: 'Matroska multimedia container, great for VLC, OBS & archival',
    ext: 'mkv',
    badge: 'Archival',
  },
  mov: {
    label: 'MOV Video',
    desc: 'QuickTime compatible movie container',
    ext: 'mov',
    badge: 'Apple',
  },
  avi: {
    label: 'AVI Video',
    desc: 'Classic Audio Video Interleave container',
    ext: 'avi',
    badge: 'Legacy',
  },
};

/**
 * Normalizes user-provided filename and ensures correct extension.
 */
export function sanitizeFilename(name: string, format: ExportFormat): string {
  // Remove path separators and illegal characters
  let base = name.trim().replace(/[\\/:*?"<>|]/g, '-');
  
  // Strip any trailing extensions matching known formats
  base = base.replace(/\.(mp4|webm|mkv|mov|avi)$/i, '');

  if (!base) {
    base = `recording-${Date.now()}`;
  }

  return `${base}.${format}`;
}

/**
 * Helper to trigger standard browser anchor download.
 */
function triggerAnchorDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Saves a recorded video blob with user-specified format, folder, and filename.
 * Supports File System Access API (showSaveFilePicker) and chrome.downloads.
 */
export async function saveRecordingFile(options: SaveFileOptions): Promise<boolean> {
  const { blob, filename, format, folder, promptFolder = true, directoryHandle } = options;
  const fullFilename = sanitizeFilename(filename, format);
  const mimeType = FORMAT_MIME_MAP[format] || 'video/webm';
  const exportBlob = new Blob([blob], { type: mimeType });
  const objectUrl = URL.createObjectURL(exportBlob);

  // Strategy 0: Direct write into user-selected directory handle
  if (directoryHandle) {
    try {
      const fileHandle = await directoryHandle.getFileHandle(fullFilename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(exportBlob);
      await writable.close();
      return true;
    } catch (err: unknown) {
      console.warn('Failed writing to chosen directory handle, falling back to picker/downloads:', err);
    }
  }

  // Strategy 1: Modern File System Access API (Prompts OS Folder/File Picker directly)
  if (promptFolder && typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const picker = (window as unknown as {
        showSaveFilePicker: (opts: unknown) => Promise<{
          createWritable: () => Promise<{
            write: (data: Blob) => Promise<void>;
            close: () => Promise<void>;
          }>;
        }>;
      }).showSaveFilePicker;

      const handle = await picker({
        suggestedName: fullFilename,
        types: [
          {
            description: `${format.toUpperCase()} Video File (*.${format})`,
            accept: {
              [mimeType]: [`.${format}`],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(exportBlob);
      await writable.close();
      return true;
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error?.name === 'AbortError') {
        // User deliberately cancelled the picker dialog
        return false;
      }
      console.warn('Native showSaveFilePicker failed or unpermitted, falling back to chrome.downloads:', err);
    }
  }

  // Strategy 2: Chrome Extension Downloads API
  if (typeof chrome !== 'undefined' && chrome.downloads?.download) {
    try {
      const targetPath = folder?.trim()
        ? `${folder.trim().replace(/^\/+|\/+$/g, '')}/${fullFilename}`
        : fullFilename;

      return await new Promise<boolean>((resolve) => {
        chrome.downloads.download(
          {
            url: objectUrl,
            filename: targetPath,
            saveAs: promptFolder,
          },
          (downloadId) => {
            if (chrome.runtime.lastError) {
              console.warn('chrome.downloads failed:', chrome.runtime.lastError.message);
              // Fallback to link click
              triggerAnchorDownload(objectUrl, fullFilename);
              resolve(true);
            } else if (downloadId === undefined) {
              // Dialog was dismissed without saving
              resolve(false);
            } else {
              resolve(true);
            }
          }
        );
      });
    } catch (err) {
      console.warn('Error in chrome.downloads, falling back to anchor download:', err);
    }
  }

  // Strategy 3: Standard Browser Anchor download fallback
  triggerAnchorDownload(objectUrl, fullFilename);
  return true;
}
