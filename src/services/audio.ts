import { AudioMode } from '../types/recording';
import { getMicrophoneMediaStream, stopMediaStream } from './media';

export interface AudioMixResult {
  audioTrack: MediaStreamTrack | null;
  audioContext: AudioContext | null;
  cleanup: () => void;
  hasSystemAudio: boolean;
}

/**
 * Prepares and mixes audio tracks based on chosen AudioMode and screen stream.
 */
export async function setupAudioTracks(
  audioMode: AudioMode,
  screenStream: MediaStream | null
): Promise<AudioMixResult> {
  let audioContext: AudioContext | null = null;
  let micStream: MediaStream | null = null;
  let hasSystemAudio = false;

  const cleanup = () => {
    stopMediaStream(micStream);
    if (audioContext && audioContext.state !== 'closed') {
      try {
        audioContext.close();
      } catch (err) {
        console.warn('Error closing AudioContext:', err);
      }
    }
  };

  if (audioMode === 'none') {
    return { audioTrack: null, audioContext: null, cleanup, hasSystemAudio: false };
  }

  // Check system audio availability from screen stream
  const systemTrack = screenStream?.getAudioTracks()[0] || null;
  hasSystemAudio = Boolean(systemTrack);

  if (audioMode === 'system') {
    if (!systemTrack) {
      console.warn('System audio was requested but not provided by the browser/system capture surface.');
    }
    return {
      audioTrack: systemTrack,
      audioContext: null,
      cleanup,
      hasSystemAudio,
    };
  }

  if (audioMode === 'microphone') {
    micStream = await getMicrophoneMediaStream();
    const micTrack = micStream.getAudioTracks()[0] || null;
    return {
      audioTrack: micTrack,
      audioContext: null,
      cleanup,
      hasSystemAudio: false,
    };
  }

  if (audioMode === 'system-microphone') {
    micStream = await getMicrophoneMediaStream();
    const micTrack = micStream.getAudioTracks()[0] || null;

    // If no system audio track is available, gracefully use just the mic
    if (!systemTrack && micTrack) {
      console.warn('System audio track unavailable; falling back to microphone audio only.');
      return {
        audioTrack: micTrack,
        audioContext: null,
        cleanup,
        hasSystemAudio: false,
      };
    }

    // If neither is available
    if (!systemTrack && !micTrack) {
      return { audioTrack: null, audioContext: null, cleanup, hasSystemAudio: false };
    }

    // If only system audio is available
    if (systemTrack && !micTrack) {
      return { audioTrack: systemTrack, audioContext: null, cleanup, hasSystemAudio: true };
    }

    // Both available: Mix them together using Web Audio API
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContext = new AudioCtx();

      const destination = audioContext.createMediaStreamDestination();

      if (systemTrack) {
        const systemSource = audioContext.createMediaStreamSource(new MediaStream([systemTrack]));
        systemSource.connect(destination);
      }

      if (micTrack) {
        const micSource = audioContext.createMediaStreamSource(new MediaStream([micTrack]));
        micSource.connect(destination);
      }

      const mixedTrack = destination.stream.getAudioTracks()[0] || null;
      return {
        audioTrack: mixedTrack,
        audioContext,
        cleanup,
        hasSystemAudio: true,
      };
    } catch (err) {
      console.warn('Failed to mix audio with AudioContext, falling back to microphone track:', err);
      return {
        audioTrack: micTrack,
        audioContext: null,
        cleanup,
        hasSystemAudio,
      };
    }
  }

  return { audioTrack: null, audioContext: null, cleanup, hasSystemAudio: false };
}
