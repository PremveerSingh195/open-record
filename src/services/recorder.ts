import { RecordingResult } from '../types/recording';
import { getSupportedMimeType } from '../utils/mimeType';

export interface RecorderService {
  start: (stream: MediaStream, preferredFormat?: 'mp4' | 'webm') => void;
  stop: () => Promise<RecordingResult>;
  getMimeType: () => string;
  isRecording: () => boolean;
}

/**
 * Creates an instance of MediaRecorder wrapper that manages chunk buffering and blob output.
 */
export function createRecorderService(): RecorderService {
  let mediaRecorder: MediaRecorder | null = null;
  let recordedChunks: Blob[] = [];
  let startTime = 0;
  let activeMimeType = '';

  const isRecording = (): boolean => {
    return mediaRecorder?.state === 'recording';
  };

  const getMimeType = (): string => activeMimeType;

  const start = (stream: MediaStream, preferredFormat: 'mp4' | 'webm' = 'mp4'): void => {
    recordedChunks = [];
    startTime = Date.now();
    activeMimeType = getSupportedMimeType(preferredFormat);

    try {
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: activeMimeType,
        videoBitsPerSecond: 3_000_000, // 3 Mbps for crisp 1080p recording
      });
    } catch (err) {
      console.warn(`Failed to initialize MediaRecorder with ${activeMimeType}, using default:`, err);
      mediaRecorder = new MediaRecorder(stream);
      activeMimeType = mediaRecorder.mimeType || 'video/webm';
    }

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    // Request data chunk every 1000ms
    mediaRecorder.start(1000);
  };

  const stop = (): Promise<RecordingResult> => {
    return new Promise<RecordingResult>((resolve, reject) => {
      if (!mediaRecorder) {
        return reject(new Error('MediaRecorder was not initialized.'));
      }

      const finishRecording = () => {
        const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const blob = new Blob(recordedChunks, { type: activeMimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);

        resolve({
          blob,
          url,
          durationSeconds,
          mimeType: activeMimeType,
          timestamp: new Date(),
        });
      };

      if (mediaRecorder.state === 'inactive') {
        finishRecording();
      } else {
        mediaRecorder.onstop = () => {
          finishRecording();
        };

        try {
          mediaRecorder.stop();
        } catch (err) {
          reject(err);
        }
      }
    });
  };

  return {
    start,
    stop,
    getMimeType,
    isRecording,
  };
}
