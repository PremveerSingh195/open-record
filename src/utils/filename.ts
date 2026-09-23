import { RecordingMode } from '../types/recording';
import { getExtensionForMimeType } from './mimeType';

/**
 * Generates formatted filename for recorded video.
 * Example: screen-recording-2026-09-23-15-45.webm
 */
export function generateRecordingFilename(
  mode: RecordingMode,
  mimeType: string,
  date: Date = new Date()
): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  const prefix = mode === 'camera' ? 'camera-recording' : 'screen-recording';
  const extension = getExtensionForMimeType(mimeType);

  return `${prefix}-${year}-${month}-${day}-${hours}-${minutes}-${seconds}.${extension}`;
}
