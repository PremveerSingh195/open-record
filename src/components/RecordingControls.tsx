import React from 'react';
import { Square, Info } from 'lucide-react';
import { formatDuration } from '../utils/formatTime';
import { RecordingMode, AudioMode } from '../types/recording';

interface RecordingControlsProps {
  durationSeconds: number;
  mode: RecordingMode;
  audioMode: AudioMode;
  onStop: () => void;
  systemNotice?: string | null;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  durationSeconds,
  mode,
  audioMode,
  onStop,
  systemNotice,
}) => {
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
        return 'Microphone';
      case 'system':
        return 'System Audio';
      case 'system-microphone':
        return 'System + Mic';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
      {/* Mode & Audio Badges */}
      <div className="flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {getModeLabel()}
        </span>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {getAudioLabel()}
        </span>
      </div>

      {/* Recording Pulse & Timer */}
      <div className="flex flex-col items-center space-y-2 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600" />
          </span>
          <span className="text-3xl font-mono font-bold tracking-tight text-slate-900 tabular-nums">
            {formatDuration(durationSeconds)}
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">Recording in progress...</p>
      </div>

      {/* System Audio Alert (if any) */}
      {systemNotice && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] text-left">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{systemNotice}</span>
        </div>
      )}

      {/* Stop Recording Button */}
      <div className="w-full pt-2">
        <button
          type="button"
          onClick={onStop}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-medium text-sm bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-md shadow-rose-600/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Square className="w-4 h-4 fill-white" />
          <span>Stop Recording</span>
        </button>
      </div>
    </div>
  );
};
