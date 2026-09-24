import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, AlertCircle, RefreshCw, ExternalLink, HelpCircle, ShieldAlert } from 'lucide-react';
import { RecordingMode, RecorderError } from '../types/recording';

interface CameraPreviewProps {
  stream: MediaStream | null;
  mode: RecordingMode;
  isLoading: boolean;
  error: RecorderError | null;
  onRetry?: () => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  stream,
  mode,
  isLoading,
  error,
  onRetry,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [showMacHelp, setShowMacHelp] = useState(false);

  const attachStreamToVideo = useCallback(
    (video: HTMLVideoElement | null, mediaStream: MediaStream | null) => {
      if (!video) return;
      if (mediaStream) {
        if (video.srcObject !== mediaStream) {
          video.srcObject = mediaStream;
        }
        video.play().catch((err) => {
          console.warn('Camera preview autoplay interrupted:', err);
        });
      } else {
        video.srcObject = null;
      }
    },
    []
  );

  // Callback ref so whenever the video element mounts or remounts, srcObject is attached immediately
  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      attachStreamToVideo(node, stream);
    },
    [stream, attachStreamToVideo]
  );

  // Re-verify stream attachment whenever stream or mode changes
  useEffect(() => {
    attachStreamToVideo(videoRef.current, stream);
  }, [stream, mode, attachStreamToVideo]);

  // Resume playback on visibility / focus changes if paused by browser
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && videoRef.current && stream) {
        if (videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
        videoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [stream]);

  if (mode === 'screen') {
    return null;
  }

  const openPermissionTab = () => {
    const url = typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('index.html?request=camera')
      : window.location.origin + window.location.pathname + '?request=camera';

    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  const isDenied = error && (
    error.title.toLowerCase().includes('denied') ||
    error.message.toLowerCase().includes('denied')
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
          Camera Preview
        </label>
        {stream && !isLoading && !error && (
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Camera Active
          </span>
        )}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-slate-950 aspect-video flex items-center justify-center shadow-inner">
        {isLoading && (
          <div className="flex flex-col items-center space-y-2 text-slate-400 z-20">
            <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
            <span className="text-xs">Connecting camera...</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 text-center space-y-2 max-w-xs z-30">
            <AlertCircle className="w-5 h-5 text-rose-400 mx-auto" />
            <p className="text-xs font-semibold text-white">{error.title}</p>
            <p className="text-[11px] text-slate-300 leading-tight">
              {isDenied
                ? 'Chrome blocks permission prompts inside extension popups.'
                : error.message}
            </p>

            <div className="pt-1 flex flex-col gap-1.5 items-center">
              {/* Primary action: Open dedicated tab to grant permission */}
              <button
                type="button"
                onClick={openPermissionTab}
                className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px] shadow-sm transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Grant Permission in Tab</span>
              </button>

              <div className="flex items-center gap-3">
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Try again</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowMacHelp(!showMacHelp)}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-300 hover:text-rose-200"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>macOS Fix</span>
                </button>
              </div>
            </div>

            {/* macOS Helper Instructions */}
            {showMacHelp && (
              <div className="mt-2 p-2 rounded-lg bg-slate-900/90 border border-slate-700 text-[10px] text-left text-slate-200 space-y-1">
                <p className="font-semibold text-rose-300 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  macOS System Permission:
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-300 pl-0.5">
                  <li>Apple  → <strong>System Settings</strong></li>
                  <li><strong>Privacy & Security → Camera</strong></li>
                  <li>Toggle <strong>Google Chrome</strong> to <strong>ON</strong></li>
                </ol>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && !stream && (
          <div className="flex flex-col items-center space-y-1.5 text-slate-400 z-20">
            <Camera className="w-6 h-6 text-slate-500" />
            <span className="text-xs">Camera preview unavailable</span>
          </div>
        )}

        {/* Screen Area simulation (only visible in screen-camera mode) */}
        {mode === 'screen-camera' && !error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="w-[calc(100%-16px)] h-[calc(100%-16px)] flex items-center justify-center text-slate-500 text-xs font-medium border border-dashed border-slate-800 rounded-lg">
              Screen Area
            </div>
          </div>
        )}

        {/* Persistent camera video element - transitions smoothly between full preview and PIP circle without unmounting */}
        <div
          className={`transition-all duration-300 ease-in-out z-10 ${
            mode === 'camera'
              ? 'absolute inset-0 w-full h-full rounded-none overflow-hidden'
              : 'absolute bottom-3 right-3 w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg bg-slate-800'
          } ${stream && !error && !isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <video
            ref={setVideoRef}
            muted
            playsInline
            autoPlay
            onLoadedMetadata={(e) => {
              e.currentTarget.play().catch(() => {});
            }}
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>
      </div>
    </div>
  );
};

