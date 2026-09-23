import { RecorderError } from '../types/recording';

/**
 * Checks if screen capture API is supported.
 */
export function isScreenCaptureSupported(): boolean {
  return Boolean(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function'
  );
}

/**
 * Checks if camera/mic getUserMedia is supported.
 */
export function isUserMediaSupported(): boolean {
  return Boolean(
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
  );
}

/**
 * Acquires screen capture stream with optional system audio.
 */
export async function getScreenMediaStream(captureSystemAudio: boolean): Promise<MediaStream> {
  if (!isScreenCaptureSupported()) {
    throw new Error('Screen capture is not supported in this browser environment.');
  }

  return await navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: { ideal: 30, max: 60 },
    },
    audio: captureSystemAudio ? true : false,
  });
}

/**
 * Acquires camera video stream.
 */
export async function getCameraMediaStream(): Promise<MediaStream> {
  if (!isUserMediaSupported()) {
    throw new Error('Camera access is not supported in this browser.');
  }

  return await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: 'user',
    },
    audio: false,
  });
}

/**
 * Acquires microphone audio stream.
 */
export async function getMicrophoneMediaStream(): Promise<MediaStream> {
  if (!isUserMediaSupported()) {
    throw new Error('Microphone access is not supported in this browser.');
  }

  return await navigator.mediaDevices.getUserMedia({
    video: false,
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
}

/**
 * Safely stops all tracks in a MediaStream.
 */
export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch (err) {
      console.warn('Error stopping track:', err);
    }
  });
}

/**
 * Translates native browser errors into friendly user-facing messages.
 */
export function parseMediaError(error: unknown, context: 'screen' | 'camera' | 'microphone' | 'recording'): RecorderError {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      if (context === 'camera') {
        return {
          title: 'Camera Access Denied',
          message: 'Camera access was denied. Please allow camera access in Chrome and try again.',
        };
      }
      if (context === 'microphone') {
        return {
          title: 'Microphone Access Denied',
          message: 'Microphone access was denied. Please allow microphone access in Chrome and try again.',
        };
      }
      if (context === 'screen') {
        return {
          title: 'Screen Sharing Cancelled',
          message: 'Screen capture permission was denied or cancelled.',
        };
      }
    }

    if (error.name === 'AbortError') {
      return {
        title: 'Selection Cancelled',
        message: 'The screen or device selection was cancelled.',
      };
    }

    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return {
        title: 'Device Not Found',
        message: `No ${context === 'camera' ? 'camera' : 'microphone'} device was found on your computer.`,
      };
    }

    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return {
        title: 'Device In Use',
        message: `The ${context} is already in use by another application or tab.`,
      };
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    title: 'Recording Error',
    message: message || 'An unexpected error occurred while preparing the recording.',
  };
}
