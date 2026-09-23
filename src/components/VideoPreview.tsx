import React, { useRef, useState, useEffect } from 'react';
import { Download, RotateCcw, CheckCircle2 } from 'lucide-react';
import { RecordingResult, RecordingMode, RecordingPreferences } from '../types/recording';
import { generateBaseRecordingFilename } from '../utils/filename';
import { formatDuration } from '../utils/formatTime';
import { SaveOptionsModal } from './SaveOptionsModal';
import { saveRecordingFile, SaveFileOptions } from '../services/download';
import { getStoredPreferences, saveStoredPreferences } from '../services/storage';

interface VideoPreviewProps {
  result: RecordingResult;
  mode: RecordingMode;
  onNewRecording: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  result,
  mode,
  onNewRecording,
}) => {
  const [downloaded, setDownloaded] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [preferences, setPreferences] = useState<RecordingPreferences | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    getStoredPreferences().then(setPreferences);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const defaultBaseFilename = generateBaseRecordingFilename(mode, result.timestamp);

  const handleOpenSaveModal = () => {
    setIsSaveModalOpen(true);
  };

  const handleSave = async (options: SaveFileOptions): Promise<boolean> => {
    const success = await saveRecordingFile(options);
    if (success) {
      setDownloaded(true);
      // Persist chosen format and folder preferences for next time
      saveStoredPreferences({
        preferredFormat: options.format,
        defaultFolder: options.folder,
        alwaysPromptFolder: options.promptFolder,
      });
    }
    return success;
  };

  return (
    <div className="p-5 space-y-4">
      {/* Title & Metadata */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Recording Preview</h2>
          <p className="text-[11px] text-slate-500 font-medium">
            Duration: {formatDuration(result.durationSeconds)} • Size: {formatFileSize(result.blob.size)}
          </p>
        </div>
      </div>

      {/* Native Video Player */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-black aspect-video shadow-sm">
        <video
          ref={videoRef}
          src={result.url}
          controls
          playsInline
          className="w-full h-full object-contain"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleOpenSaveModal}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-xs transition-all shadow-sm active:scale-[0.98] ${
            downloaded
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
          }`}
        >
          {downloaded ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved (Save Again)</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Save Recording</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onNewRecording}
          className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-xs active:scale-[0.98] transition-all"
        >
          <RotateCcw className="w-4 h-4 text-slate-500" />
          <span>New Recording</span>
        </button>
      </div>

      {/* Save Options Modal (Format & Folder Selector) */}
      <SaveOptionsModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSave}
        defaultFilename={defaultBaseFilename}
        blob={result.blob}
        durationSeconds={result.durationSeconds}
        initialFormat={preferences?.preferredFormat || 'mp4'}
        initialFolder={preferences?.defaultFolder || ''}
        initialPromptFolder={preferences?.alwaysPromptFolder ?? true}
      />
    </div>
  );
};
