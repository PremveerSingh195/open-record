/**
 * Dynamically detects the best supported MIME type for MediaRecorder.
 * When preferredFormat is 'mp4', it checks for native MP4 / H.264 hardware support first.
 */
export function getSupportedMimeType(preferredFormat: 'mp4' | 'webm' = 'mp4'): string {
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return 'video/webm';
  }

  const mp4Candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=h264,opus',
  ];

  const webmCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  const preferredList = preferredFormat === 'mp4'
    ? [...mp4Candidates, ...webmCandidates]
    : [...webmCandidates, ...mp4Candidates];

  for (const type of preferredList) {
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
