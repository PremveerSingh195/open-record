import React from 'react';
import { Monitor, UserCheck, Camera } from 'lucide-react';
import { RecordingMode } from '../types/recording';

interface RecordingModeSelectorProps {
  selectedMode: RecordingMode;
  onChange: (mode: RecordingMode) => void;
  disabled?: boolean;
}

interface ModeOption {
  id: RecordingMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODES: ModeOption[] = [
  {
    id: 'screen',
    label: 'Screen',
    icon: Monitor,
  },
  {
    id: 'screen-camera',
    label: 'Screen + Camera',
    icon: UserCheck,
  },
  {
    id: 'camera',
    label: 'Camera',
    icon: Camera,
  },
];

export const RecordingModeSelector: React.FC<RecordingModeSelectorProps> = ({
  selectedMode,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
        Recording Mode
      </label>
      <div className="grid grid-cols-3 gap-2.5">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(mode.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-rose-500 bg-rose-50/60 text-rose-800 font-medium shadow-sm ring-2 ring-rose-500/20'
                  : 'border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              <div
                className={`p-2 rounded-lg mb-1.5 transition-colors ${
                  isSelected ? 'bg-rose-100/80 text-rose-600' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs leading-tight font-medium">
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
