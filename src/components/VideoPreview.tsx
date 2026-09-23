import React, { useRef } from 'react';
import { Download, RotateCcw, CheckCircle2 } from 'lucide-react';
import { RecordingResult, RecordingMode } from '../types/recording';
import { generateRecordingFilename } from '../utils/filename';
import { formatDuration } from '../utils/formatTime';

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
  const [downloaded, setDownloaded] = React.useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = () => {
    const filename = generateRecordingFilename(mode, result.mimeType, result.timestamp);
    const link = document.createElement('a');
    link.href = result.url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
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
          onClick={handleDownload}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-medium text-xs transition-all shadow-sm active:scale-[0.98] ${
            downloaded
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
          }`}
        >
          {downloaded ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Saved!</span>
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
    </div>
  );
};
