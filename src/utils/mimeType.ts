/**
 * Dynamically detects the best supported MIME type for MediaRecorder.
 */
export function getSupportedMimeType(): string {
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return 'video/webm';
  }

  const preferredTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
  ];

  for (const type of preferredTypes) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'video/webm';
}

/**
 * Returns file extension matching the recorded MIME type.
 */
export function getExtensionForMimeType(mimeType: string): string {
  if (mimeType.includes('mp4')) {
    return 'mp4';
  }
  return 'webm';
}
