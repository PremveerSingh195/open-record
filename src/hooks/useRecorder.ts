import { useState, useCallback, useRef, useEffect } from 'react';
import {
  RecordingMode,
  AudioMode,
  RecordingStatus,
  RecordingResult,
  RecorderError,
} from '../types/recording';
import {
  getScreenMediaStream,
  getCameraMediaStream,
  getMicrophoneMediaStream,
  stopMediaStream,
  parseMediaError,
} from '../services/media';
import { setupAudioTracks, AudioMixResult } from '../services/audio';
import { createCompositorStream, CanvasCompositor } from '../services/compositor';
import { createRecorderService, RecorderService } from '../services/recorder';
import { getStoredPreferences } from '../services/storage';

export function useRecorder() {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<RecorderError | null>(null);
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);
  const [systemAudioNotice, setSystemAudioNotice] = useState<string | null>(null);

  // References to active resources for reliable cleanup
  const recorderRef = useRef<RecorderService | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const compositeStreamRef = useRef<MediaStream | null>(null);
  const compositorRef = useRef<CanvasCompositor | null>(null);
  const audioResultRef = useRef<AudioMixResult | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const isStoppingRef = useRef(false);

  // Start timer interval
  const startTimer = () => {
    setRecordingTime(0);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  // Clear timer interval
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Central stream cleanup
  const cleanupAllStreams = useCallback(() => {
    stopTimer();

    if (compositorRef.current) {
      compositorRef.current.stop();
      compositorRef.current = null;
    }

    if (audioResultRef.current) {
      audioResultRef.current.cleanup();
      audioResultRef.current = null;
    }

    if (screenStreamRef.current) {
      stopMediaStream(screenStreamRef.current);
      screenStreamRef.current = null;
    }

    if (cameraStreamRef.current) {
      stopMediaStream(cameraStreamRef.current);
      cameraStreamRef.current = null;
    }

    if (compositeStreamRef.current) {
      stopMediaStream(compositeStreamRef.current);
      compositeStreamRef.current = null;
    }
  }, []);

  // Stop recording function
  const stopRecording = useCallback(async () => {
    if (isStoppingRef.current || !recorderRef.current) return;
    isStoppingRef.current = true;

    try {
      const result = await recorderRef.current.stop();
      cleanupAllStreams();
      setRecordingResult(result);
      setStatus('stopped');
    } catch (err) {
      console.error('Error stopping recording:', err);
      cleanupAllStreams();
      setError({
        title: 'Recording Stop Error',
        message: 'An error occurred while saving the recording.',
      });
      setStatus('error');
    } finally {
      recorderRef.current = null;
      isStoppingRef.current = false;
    }
  }, [cleanupAllStreams]);

  // Start recording function
  const startRecording = useCallback(
    async (mode: RecordingMode, audioMode: AudioMode) => {
      setError(null);
      setSystemAudioNotice(null);
      setStatus('preparing');

      try {
        let videoTrack: MediaStreamTrack | null = null;
        let audioTrack: MediaStreamTrack | null = null;

        const needSystemAudio = audioMode === 'system' || audioMode === 'system-microphone';

        // 1. Acquire media based on recording mode
        if (mode === 'screen') {
          const screenStream = await getScreenMediaStream(needSystemAudio);
          screenStreamRef.current = screenStream;

          videoTrack = screenStream.getVideoTracks()[0] || null;
          if (!videoTrack) {
            throw new Error('No video track found in screen capture.');
          }

          // Handle user clicking "Stop sharing" on Chrome's native bar
          videoTrack.onended = () => {
            stopRecording();
          };

          // Setup audio
          const audioResult = await setupAudioTracks(audioMode, screenStream);
          audioResultRef.current = audioResult;
          audioTrack = audioResult.audioTrack;

          if (needSystemAudio && !audioResult.hasSystemAudio) {
            setSystemAudioNotice(
              'System audio was not detected. Your system/tab might not support system audio capture, or the "Share audio" option was not checked.'
            );
          }
        } else if (mode === 'screen-camera') {
          // Capture screen
          const screenStream = await getScreenMediaStream(needSystemAudio);
          screenStreamRef.current = screenStream;

          // Capture camera
          const cameraStream = await getCameraMediaStream();
          cameraStreamRef.current = cameraStream;

          // Handle native stop sharing
          const screenVideoTrack = screenStream.getVideoTracks()[0];
          if (screenVideoTrack) {
            screenVideoTrack.onended = () => {
              stopRecording();
            };
          }

          // Setup audio
          const audioResult = await setupAudioTracks(audioMode, screenStream);
          audioResultRef.current = audioResult;
          audioTrack = audioResult.audioTrack;

          if (needSystemAudio && !audioResult.hasSystemAudio) {
            setSystemAudioNotice(
              'System audio was not detected in screen capture. Continuing with microphone audio.'
            );
          }

          // Create canvas composition
          const compositor = await createCompositorStream(screenStream, cameraStream);
          compositorRef.current = compositor;
          videoTrack = compositor.stream.getVideoTracks()[0] || null;

          if (!videoTrack) {
            throw new Error('Failed to create composite video track.');
          }
        } else if (mode === 'camera') {
          // Camera only
          const cameraStream = await getCameraMediaStream();
          cameraStreamRef.current = cameraStream;

          videoTrack = cameraStream.getVideoTracks()[0] || null;
          if (!videoTrack) {
            throw new Error('No camera video track available.');
          }

          if (audioMode !== 'none') {
            const micStream = await getMicrophoneMediaStream();
            audioTrack = micStream.getAudioTracks()[0] || null;
            // Store reference to clean up
            const audioResult: AudioMixResult = {
              audioTrack,
              audioContext: null,
              cleanup: () => stopMediaStream(micStream),
              hasSystemAudio: false,
            };
            audioResultRef.current = audioResult;
          }
        }

        if (!videoTrack) {
          throw new Error('Could not acquire video track for recording.');
        }

        // Combine tracks into single recorded MediaStream
        const tracksToRecord: MediaStreamTrack[] = [videoTrack];
        if (audioTrack) {
          tracksToRecord.push(audioTrack);
        }

        const recordStream = new MediaStream(tracksToRecord);
        compositeStreamRef.current = recordStream;

        // Initialize and start MediaRecorder with preferred format
        const recorder = createRecorderService();
        recorderRef.current = recorder;
        const prefs = await getStoredPreferences();
        const preferredFmt = prefs.preferredFormat === 'webm' ? 'webm' : 'mp4';
        recorder.start(recordStream, preferredFmt);

        startTimer();
        setStatus('recording');
      } catch (err) {
        cleanupAllStreams();
        const parsed = parseMediaError(
          err,
          mode === 'camera' ? 'camera' : 'screen'
        );
        setError(parsed);
        setStatus('idle');
      }
    },
    [cleanupAllStreams, stopRecording]
  );

  // Reset to initial state for a new recording
  const resetRecording = useCallback(() => {
    if (recordingResult?.url) {
      try {
        URL.revokeObjectURL(recordingResult.url);
      } catch (err) {
        console.warn('Failed to revoke object URL:', err);
      }
    }

    cleanupAllStreams();
    setRecordingResult(null);
    setError(null);
    setSystemAudioNotice(null);
    setRecordingTime(0);
    setStatus('idle');
  }, [cleanupAllStreams, recordingResult]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      cleanupAllStreams();
      if (recordingResult?.url) {
        URL.revokeObjectURL(recordingResult.url);
      }
    };
  }, [cleanupAllStreams, recordingResult]);

  return {
    status,
    recordingTime,
    error,
    recordingResult,
    systemAudioNotice,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
