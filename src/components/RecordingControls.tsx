import React, { useRef, useEffect, useState } from 'react';
import {
  Square,
  Info,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { formatDuration } from '../utils/formatTime';
import { RecordingMode, AudioMode } from '../types/recording';
import {
  openFloatingCamera,
  closeFloatingCamera,
  isFloatingCameraActive,
} from '../services/floatingCamera';

interface RecordingControlsProps {
  durationSeconds: number;
  mode: RecordingMode;
  audioMode: AudioMode;
  cameraStream?: MediaStream | null;
  onStop: () => void;
  systemNotice?: string | null;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  durationSeconds,
  mode,
  audioMode,
  cameraStream,
  onStop,
  systemNotice,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPipActive, setIsPipActive] = useState(false);

  // Sync internal video stream for camera-only mode
  useEffect(() => {
    const video = videoRef.current;
    if (video && cameraStream) {
      video.srcObject = cameraStream;
      video.play().catch((err) => {
        console.warn('Camera preview error:', err);
      });
    }
  }, [cameraStream]);

  // Clean up floating window when recording stops or component unmounts
  useEffect(() => {
    return () => {
      closeFloatingCamera();
    };
  }, []);

  // Automatically attempt to pop out the floating camera bubble when recording starts
  useEffect(() => {
    if (mode === 'screen-camera' && cameraStream && !isFloatingCameraActive()) {
      openFloatingCamera(cameraStream, () => {
        setIsPipActive(false);
      })
        .then(() => {
          setIsPipActive(true);
        })
        .catch((err) => {
          console.log('Floating camera prompt waiting for user interaction:', err);
        });
    }
  }, [cameraStream, mode]);

  const toggleFloatingCamera = async () => {
    if (isPipActive || isFloatingCameraActive()) {
      closeFloatingCamera();
      setIsPipActive(false);
      return;
    }

    if (cameraStream) {
      try {
        await openFloatingCamera(cameraStream, () => {
          setIsPipActive(false);
        });
        setIsPipActive(true);
      } catch (err) {
        console.warn('Failed to open floating camera:', err);
      }
    }
  };

  const handleStopWithCleanup = () => {
    closeFloatingCamera();
    onStop();
  };

  const hasCamera = (mode === 'screen-camera' || mode === 'camera') && !!cameraStream;

  const getModeLabel = () => {
    switch (mode) {
      case 'screen':
        return 'Screen';
      case 'screen-camera':
        return 'Screen + Camera';
      case 'camera':
        return 'Camera Only';
    }
  };

  const getAudioLabel = () => {
    switch (audioMode) {
      case 'none':
        return 'Muted';
      case 'microphone':
        return 'Mic Active';
      case 'system':
        return 'System Audio';
      case 'system-microphone':
        return 'System + Mic';
    }
  };

  return (
    <div className="flex flex-col items-center justify-between p-4 sm:p-5 text-center space-y-4 max-w-[420px] mx-auto">
      {/* Top Status Bar: Status & Badges */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
            Recording Live
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {getModeLabel()}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {getAudioLabel()}
          </span>
        </div>
      </div>

      {/* Floating Camera Controller for Screen + Camera Mode */}
      {hasCamera && mode === 'screen-camera' && (
        <div className="w-full">
          {isPipActive ? (
            <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 shadow-xs">
              <div className="flex items-center gap-2.5 text-left">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                </span>
                <div>
                  <div className="text-xs font-bold text-emerald-900">
                    Floating Camera Active
                  </div>
                  <div className="text-[10px] text-emerald-700">
                    Drag anywhere with mouse cursor
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleFloatingCamera}
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition shadow-xs cursor-pointer"
              >
                Hide Bubble
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleFloatingCamera}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-semibold text-xs transition shadow-md shadow-rose-600/20 active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>Pop Out Floating Camera</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </div>
                  <div className="text-[10px] font-normal text-white/80">
                    Draggable with mouse cursor anywhere on screen
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-white/25 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shrink-0">
                Open
              </span>
            </button>
          )}
        </div>
      )}

      {/* Widescreen Rectangle Camera Preview for Camera-Only Mode */}
      {mode === 'camera' && cameraStream && (
        <div className="w-full py-1">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-slate-800 shadow-xl bg-black">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Live Camera Indicator Badge */}
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs border border-white/10 flex items-center gap-1.5 text-[10px] text-white font-medium pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>LIVE CAM</span>
            </div>
          </div>
        </div>
      )}

      {/* Recording Duration Timer */}
      <div className="flex flex-col items-center py-2">
        <span className="text-4xl sm:text-5xl font-mono font-bold tracking-tight text-slate-900 tabular-nums">
          {formatDuration(durationSeconds)}
        </span>
        <span className="text-xs text-slate-500 font-medium mt-1">Recording in progress</span>
        {mode === 'screen-camera' && (
          <span className="text-[11px] text-slate-400 mt-1">
            You can minimize this card while recording
          </span>
        )}
      </div>

      {/* System Audio Alert (if any) */}
      {systemNotice && (
        <div className="w-full flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] text-left">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{systemNotice}</span>
        </div>
      )}

      {/* Stop Recording Button */}
      <div className="w-full pt-1">
        <button
          type="button"
          onClick={handleStopWithCleanup}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-600/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Square className="w-4 h-4 fill-white" />
          <span>Stop Recording</span>
        </button>
      </div>
    </div>
  );
};
