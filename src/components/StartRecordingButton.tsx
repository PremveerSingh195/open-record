import React from 'react';
import { Play, Loader2 } from 'lucide-react';

interface StartRecordingButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const StartRecordingButton: React.FC<StartRecordingButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium text-sm transition-all shadow-md active:scale-[0.98] ${
        disabled || isLoading
          ? 'bg-slate-300 cursor-not-allowed shadow-none'
          : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20 hover:shadow-rose-600/30'
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Preparing capture...</span>
        </>
      ) : (
        <>
          <span className="w-2.5 h-2.5 rounded-full bg-white shadow-xs" />
          <Play className="w-4 h-4 fill-white" />
          <span>Start Recording</span>
        </>
      )}
    </button>
  );
};
