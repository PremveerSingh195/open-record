export type RecordingMode = 'screen' | 'screen-camera' | 'camera';

export type AudioMode = 'none' | 'microphone' | 'system-microphone' | 'system';

export type RecordingStatus = 'idle' | 'preparing' | 'recording' | 'stopped' | 'error';

export type ExportFormat = 'mp4' | 'webm' | 'mkv' | 'mov' | 'avi';

export interface SaveOptions {
  filename: string;
  format: ExportFormat;
  folder: string;
  promptFolder: boolean;
  directoryHandle?: FileSystemDirectoryHandle | null;
}

export interface RecordingPreferences {
  recordingMode: RecordingMode;
  audioMode: AudioMode;
  preferredFormat?: ExportFormat;
  defaultFolder?: string;
  alwaysPromptFolder?: boolean;
}

export interface RecordingResult {
  blob: Blob;
  url: string;
  durationSeconds: number;
  mimeType: string;
  timestamp: Date;
}

export interface CameraOverlayConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  sizeRatio: number; // e.g. 0.22 = 22% of screen width
  shape: 'circle' | 'rounded-rect';
}

export interface RecorderError {
  title: string;
  message: string;
  details?: string;
}
