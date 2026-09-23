import { useState, useCallback, useEffect, useRef } from 'react';
import { RecorderError } from '../types/recording';
import { getCameraMediaStream, stopMediaStream, parseMediaError } from '../services/media';

export function useCamera() {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<RecorderError | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    // If stream already active and not ended, reuse it
    if (activeStreamRef.current && activeStreamRef.current.active) {
      return activeStreamRef.current;
    }

    setIsLoading(true);
    setCameraError(null);

    try {
      const stream = await getCameraMediaStream();
      activeStreamRef.current = stream;
      setCameraStream(stream);
      setIsLoading(false);
      return stream;
    } catch (err) {
      const parsed = parseMediaError(err, 'camera');
      setCameraError(parsed);
      setIsLoading(false);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (activeStreamRef.current) {
      stopMediaStream(activeStreamRef.current);
      activeStreamRef.current = null;
      setCameraStream(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeStreamRef.current) {
        stopMediaStream(activeStreamRef.current);
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
