import React, { useEffect, useRef, useState } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showMacHelp, setShowMacHelp] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (stream) {
        video.srcObject = stream;
        video.play().catch((err) => {
          console.warn('Camera preview autoplay interrupted:', err);
        });
      } else {
        video.srcObject = null;
      }
    }
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
        {stream && (
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Camera Active
          </span>
        )}
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-slate-950 aspect-video flex items-center justify-center shadow-inner">
        {isLoading && (
          <div className="flex flex-col items-center space-y-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
            <span className="text-xs">Connecting camera...</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 text-center space-y-2 max-w-xs z-10">
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
          <div className="flex flex-col items-center space-y-1.5 text-slate-400">
            <Camera className="w-6 h-6 text-slate-500" />
            <span className="text-xs">Camera preview unavailable</span>
          </div>
        )}

        {/* Video feed */}
        {mode === 'camera' ? (
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className={`w-full h-full object-cover scale-x-[-1] ${
              stream ? 'block' : 'hidden'
            }`}
          />
        ) : (
          /* Screen + Camera layout simulation */
          <div className={`relative w-full h-full bg-slate-900 ${stream ? 'block' : 'hidden'}`}>
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-medium border border-dashed border-slate-800 m-2 rounded-lg">
              Screen Area
            </div>
            {/* Draggable/positioned camera avatar overlay preview */}
            <div className="absolute bottom-3 right-3 w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg bg-slate-800">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="w-full h-full object-cover scale-x-[-1]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
