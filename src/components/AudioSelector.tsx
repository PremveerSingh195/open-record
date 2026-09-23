import React from 'react';
import { Mic, MicOff, Volume2, Layers } from 'lucide-react';
import { AudioMode, RecordingMode } from '../types/recording';

interface AudioSelectorProps {
  selectedAudio: AudioMode;
  recordingMode: RecordingMode;
  onChange: (mode: AudioMode) => void;
  disabled?: boolean;
}

interface AudioOption {
  id: AudioMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  screenOnly?: boolean;
}

const AUDIO_OPTIONS: AudioOption[] = [
  {
    id: 'none',
    label: 'None',
    description: 'Record video without audio',
    icon: MicOff,
  },
  {
    id: 'microphone',
    label: 'Microphone',
    description: 'Capture your voice with mic',
    icon: Mic,
  },
  {
    id: 'system-microphone',
    label: 'System + Microphone',
    description: 'Combine tab/system sound and mic',
    icon: Layers,
    screenOnly: true,
  },
  {
    id: 'system',
    label: 'System audio',
    description: 'Capture audio from shared screen/tab',
    icon: Volume2,
    screenOnly: true,
  },
];

export const AudioSelector: React.FC<AudioSelectorProps> = ({
  selectedAudio,
  recordingMode,
  onChange,
  disabled = false,
}) => {
  const isCameraOnly = recordingMode === 'camera';

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Audio Source
      </label>
      <div className="space-y-1.5">
        {AUDIO_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isUnsupportedInCamera = isCameraOnly && opt.screenOnly;
          const isSelected = selectedAudio === opt.id && !isUnsupportedInCamera;
          const isItemDisabled = disabled || isUnsupportedInCamera;

          return (
            <label
              key={opt.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                isSelected
                  ? 'border-rose-500 bg-rose-50/40 text-slate-900 shadow-xs'
                  : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              } ${isItemDisabled ? 'opacity-40 cursor-not-allowed bg-slate-50/60' : 'cursor-pointer'}`}
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="audio-option"
                  value={opt.id}
                  checked={isSelected}
                  disabled={isItemDisabled}
                  onChange={() => onChange(opt.id)}
                  className="w-4 h-4 text-rose-600 border-slate-300 focus:ring-rose-500 focus:ring-offset-0 transition-colors"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-800">
                      {opt.label}
                    </span>
                    {isUnsupportedInCamera && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Screen only)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {opt.description}
                  </p>
                </div>
              </div>

              <div
                className={`p-1.5 rounded-lg ${
                  isSelected ? 'text-rose-600 bg-rose-100/60' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};
