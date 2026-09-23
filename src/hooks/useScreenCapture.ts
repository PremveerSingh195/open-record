import { useState, useCallback, useRef } from 'react';
import { getScreenMediaStream, stopMediaStream, parseMediaError } from '../services/media';
import { RecorderError } from '../types/recording';

export function useScreenCapture() {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [screenError, setScreenError] = useState<RecorderError | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);

  const startScreenCapture = useCallback(async (captureSystemAudio: boolean) => {
    setScreenError(null);
    try {
      const stream = await getScreenMediaStream(captureSystemAudio);
      activeStreamRef.current = stream;
      setScreenStream(stream);
      return stream;
    } catch (err) {
      const parsed = parseMediaError(err, 'screen');
      setScreenError(parsed);
      return null;
    }
  }, []);

  const stopScreenCapture = useCallback(() => {
    if (activeStreamRef.current) {
      stopMediaStream(activeStreamRef.current);
      activeStreamRef.current = null;
      setScreenStream(null);
    }
  }, []);

  return {
    screenStream,
    screenError,
    startScreenCapture,
    stopScreenCapture,
  };
}
