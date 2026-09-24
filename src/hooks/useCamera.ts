import { useState, useCallback, useEffect, useRef } from 'react';
import { RecorderError } from '../types/recording';
import { getCameraMediaStream, stopMediaStream, parseMediaError } from '../services/media';

export function useCamera() {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<RecorderError | null>(null);

  const activeStreamRef = useRef<MediaStream | null>(null);
  const inFlightPromiseRef = useRef<Promise<MediaStream | null> | null>(null);
  const isCancelledRef = useRef(false);

  const isStreamLive = (stream: MediaStream | null): boolean => {
    if (!stream || !stream.active) return false;
    const tracks = stream.getVideoTracks();
    return tracks.length > 0 && tracks.some((t) => t.readyState === 'live');
  };

  const stopCamera = useCallback(() => {
    isCancelledRef.current = true;
    inFlightPromiseRef.current = null;

    if (activeStreamRef.current) {
      stopMediaStream(activeStreamRef.current);
      activeStreamRef.current = null;
    }
    setCameraStream(null);
    setIsLoading(false);
  }, []);

  const startCamera = useCallback(async (): Promise<MediaStream | null> => {
    isCancelledRef.current = false;

    // 1. If stream is already live, reuse it and ensure state is synchronized
    if (isStreamLive(activeStreamRef.current)) {
      const liveStream = activeStreamRef.current!;
      setCameraStream(liveStream);
      setCameraError(null);
      setIsLoading(false);
      return liveStream;
    }

    // 2. If a request is already in progress, avoid duplicate getUserMedia calls
    if (inFlightPromiseRef.current) {
      return inFlightPromiseRef.current;
    }

    setIsLoading(true);
    setCameraError(null);

    const promise = (async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await getCameraMediaStream();
        } catch (firstErr) {
          // If rapid mode switching just stopped a stream, wait 200ms and retry once
          // (macOS AVFoundation camera release grace period)
          if (
            firstErr instanceof DOMException &&
            (firstErr.name === 'NotReadableError' || firstErr.name === 'TrackStartError')
          ) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            if (isCancelledRef.current) return null;
            stream = await getCameraMediaStream();
          } else {
            throw firstErr;
          }
        }

        // If stopCamera was called while getUserMedia was resolving, discard immediately
        if (isCancelledRef.current) {
          stopMediaStream(stream);
          return null;
        }

        // Setup onended listener for each video track
        stream.getVideoTracks().forEach((track) => {
          track.addEventListener('ended', () => {
            if (activeStreamRef.current === stream) {
              stopCamera();
            }
          });
        });

        activeStreamRef.current = stream;
        setCameraStream(stream);
        setIsLoading(false);
        return stream;
      } catch (err) {
        if (isCancelledRef.current) return null;
        const parsed = parseMediaError(err, 'camera');
        setCameraError(parsed);
        setIsLoading(false);
        return null;
      } finally {
        inFlightPromiseRef.current = null;
      }
    })();

    inFlightPromiseRef.current = promise;
    return promise;
  }, [stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      inFlightPromiseRef.current = null;
      if (activeStreamRef.current) {
        stopMediaStream(activeStreamRef.current);
        activeStreamRef.current = null;
      }
    };
  }, []);

  return {
    cameraStream,
    isLoading,
    cameraError,
    startCamera,
    stopCamera,
  };
}

