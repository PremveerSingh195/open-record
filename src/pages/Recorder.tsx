import React, { useEffect, useState, useCallback } from 'react';
import { RecordingMode, AudioMode, RecordingStatus, RecorderError } from '../types/recording';
import { getStoredPreferences, saveStoredPreferences } from '../services/storage';
import { RecordingModeSelector } from '../components/RecordingModeSelector';
import { AudioSelector } from '../components/AudioSelector';
import { StartRecordingButton } from '../components/StartRecordingButton';
import { RecordingControls } from '../components/RecordingControls';
import { CameraPreview } from '../components/CameraPreview';
import { useCamera } from '../hooks/useCamera';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface RecorderPageProps {
  status: RecordingStatus;
  recordingTime: number;
  error: RecorderError | null;
  systemNotice: string | null;
  activeCameraStream?: MediaStream | null;
  onStartRecording: (mode: RecordingMode, audio: AudioMode) => void;
  onStopRecording: () => void;
}

export const RecorderPage: React.FC<RecorderPageProps> = ({
  status,
  recordingTime,
  error,
  systemNotice,
  activeCameraStream,
  onStartRecording,
  onStopRecording,
}) => {
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('screen');
  const [audioMode, setAudioMode] = useState<AudioMode>('microphone');
  const [isInitializing, setIsInitializing] = useState(true);

  const {
    cameraStream,
    isLoading: isCameraLoading,
    cameraError,
    startCamera,
    stopCamera,
  } = useCamera();

  // Load preferences from chrome.storage on initial mount
  useEffect(() => {
    let isMounted = true;
    getStoredPreferences().then((prefs) => {
      if (isMounted) {
        setRecordingMode(prefs.recordingMode);
        setAudioMode(prefs.audioMode);
        setIsInitializing(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync camera stream for preview if mode requires camera
  useEffect(() => {
    if (isInitializing) return;

    if (status === 'recording') {
      // During active recording, stop standalone camera preview stream to free hardware
      stopCamera();
      return;
    }

    if (recordingMode === 'screen-camera' || recordingMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [recordingMode, status, isInitializing, startCamera, stopCamera]);

  const handleModeChange = useCallback((mode: RecordingMode) => {
    setRecordingMode(mode);
    saveStoredPreferences({ recordingMode: mode });

    // In camera-only mode, if system audio was chosen, fall back to microphone
    if (mode === 'camera' && (audioMode === 'system' || audioMode === 'system-microphone')) {
      setAudioMode('microphone');
      saveStoredPreferences({ audioMode: 'microphone' });
    }
  }, [audioMode]);

  const handleAudioChange = useCallback((audio: AudioMode) => {
    setAudioMode(audio);
    saveStoredPreferences({ audioMode: audio });
  }, []);

  const handleStart = () => {
    // If running in a transient popup bubble, open persistent window so Chrome doesn't close on screen share
    try {
      if (typeof chrome !== 'undefined' && chrome.extension?.getViews) {
        const isPopup = chrome.extension.getViews({ type: 'popup' }).includes(window);
        if (isPopup && chrome.windows?.create) {
          chrome.windows.create({
            url: chrome.runtime.getURL('index.html'),
            type: 'popup',
            width: 440,
            height: 660,
            focused: true,
          });
          window.close();
          return;
        }
      }
    } catch (err) {
      console.warn('Popup check error:', err);
    }

    // Stop local preview camera stream so the recorder can claim exclusive access cleanly
    stopCamera();
    onStartRecording(recordingMode, audioMode);
  };

  // Dedicated Recording view when recording is active
  if (status === 'recording') {
    return (
      <RecordingControls
        durationSeconds={recordingTime}
        mode={recordingMode}
        audioMode={audioMode}
        cameraStream={activeCameraStream}
        onStop={onStopRecording}
        systemNotice={systemNotice}
      />
    );
  }

  return (
    <div className="p-5 space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-900">{error.title}</p>
            <p className="mt-0.5 text-rose-700 leading-normal">{error.message}</p>
          </div>
        </div>
      )}

      {/* Recording Mode Selector */}
      <RecordingModeSelector
        selectedMode={recordingMode}
        onChange={handleModeChange}
        disabled={status === 'preparing' || isInitializing}
      />

      {/* Camera Live Preview (Screen+Camera or Camera) */}
      {(recordingMode === 'screen-camera' || recordingMode === 'camera') && (
        <CameraPreview
          stream={cameraStream}
          mode={recordingMode}
          isLoading={isCameraLoading}
          error={cameraError}
          onRetry={startCamera}
        />
      )}

      {/* Audio Selector */}
      <AudioSelector
        selectedAudio={audioMode}
        recordingMode={recordingMode}
        onChange={handleAudioChange}
        disabled={status === 'preparing' || isInitializing}
      />

      {/* Start Recording Button */}
      <div className="pt-1">
        <StartRecordingButton
          onClick={handleStart}
          isLoading={status === 'preparing'}
          disabled={isInitializing}
        />
      </div>

      {/* Subtle popup hint if in small extension popup */}
      <div className="flex items-center justify-center text-center">
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-slate-400" />
          Tip: You can expand to a full tab using the icon at the top right.
        </p>
      </div>
    </div>
  );
};
