import { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { RecorderPage } from './pages/Recorder';
import { PreviewPage } from './pages/Preview';
import { PermissionsPage } from './pages/Permissions';
import { useRecorder } from './hooks/useRecorder';
import { RecordingMode, AudioMode } from './types/recording';

export function App() {
  const [activeMode, setActiveMode] = useState<RecordingMode>('screen');
  const [isPermissionRequest, setIsPermissionRequest] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('request=camera')) {
      setIsPermissionRequest(true);
    }
  }, []);

  const {
    status,
    recordingTime,
    error,
    recordingResult,
    systemAudioNotice,
    activeCameraStream,
    startRecording,
    stopRecording,
    resetRecording,
  } = useRecorder();

  const handleStart = useCallback(
    (mode: RecordingMode, audio: AudioMode, initialCameraStream?: MediaStream | null) => {
      setActiveMode(mode);
      startRecording(mode, audio, initialCameraStream);
    },
    [startRecording]
  );

  if (isPermissionRequest) {
    return (
      <PermissionsPage
        onContinue={() => {
          setIsPermissionRequest(false);
          // Remove query parameter from URL without page reload
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-0 sm:p-4">
      <main className="w-full max-w-[420px] min-h-[520px] bg-white rounded-none sm:rounded-2xl shadow-none sm:shadow-xl sm:border border-slate-200/90 overflow-hidden flex flex-col justify-between">
        <div>
          <Header isRecording={status === 'recording'} />

          {status === 'stopped' && recordingResult ? (
            <PreviewPage
              result={recordingResult}
              mode={activeMode}
              onNewRecording={resetRecording}
            />
          ) : (
            <RecorderPage
              status={status}
              recordingTime={recordingTime}
              error={error}
              systemNotice={systemAudioNotice}
              activeCameraStream={activeCameraStream}
              onStartRecording={handleStart}
              onStopRecording={stopRecording}
            />
          )}
        </div>

        {/* Footer info */}
        <footer className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>v1.0.0</span>
          <span>Screen & Camera Recorder</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
