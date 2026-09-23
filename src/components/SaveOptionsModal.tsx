import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FolderOpen,
  FolderCheck,
  Check,
  Folder,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ExportFormat } from '../types/recording';
import { FORMAT_CONFIG, SaveFileOptions } from '../services/download';
import { formatDuration } from '../utils/formatTime';

interface SaveOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (options: SaveFileOptions) => Promise<boolean>;
  defaultFilename: string;
  blob: Blob;
  durationSeconds: number;
  initialFormat?: ExportFormat;
  initialFolder?: string;
  initialPromptFolder?: boolean;
}

export const SaveOptionsModal: React.FC<SaveOptionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultFilename,
  blob,
  durationSeconds,
  initialFormat = 'mp4',
  initialFolder = '',
  initialPromptFolder = true,
}) => {
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [filename, setFilename] = useState(defaultFilename);
  const [promptFolder, setPromptFolder] = useState(initialPromptFolder);
  const [folder, setFolder] = useState(initialFolder);
  const [selectedDir, setSelectedDir] = useState<FileSystemDirectoryHandle | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename);
      setFormat(initialFormat);
      setFolder(initialFolder);
      setPromptFolder(initialPromptFolder);
      setSelectedDir(null);
    }
  }, [isOpen, defaultFilename, initialFormat, initialFolder, initialPromptFolder]);

  if (!isOpen) return null;

  const handleBrowseFolder = async () => {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      try {
        const picker = (window as unknown as {
          showDirectoryPicker: (opts?: unknown) => Promise<FileSystemDirectoryHandle>;
        }).showDirectoryPicker;
        const dirHandle = await picker({ mode: 'readwrite' });
        if (dirHandle) {
          setSelectedDir(dirHandle);
          setFolder(dirHandle.name);
        }
      } catch (err: unknown) {
        const error = err as { name?: string };
        if (error?.name !== 'AbortError') {
          console.warn('showDirectoryPicker failed:', err);
        }
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const success = await onSave({
        blob,
        filename,
        format,
        folder,
        promptFolder,
        directoryHandle: selectedDir,
      });

      if (success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const availableFormats: ExportFormat[] = ['mp4', 'webm', 'mkv', 'mov', 'avi'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 id="save-modal-title" className="text-sm font-semibold text-slate-800 leading-tight">
                Save Recording
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {formatDuration(durationSeconds)} • {formatFileSize(blob.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close save dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleConfirmSave} className="p-5 space-y-4 overflow-y-auto">
          {/* Filename Input */}
          <div className="space-y-1.5">
            <label htmlFor="filename-input" className="block text-xs font-semibold text-slate-700">
              File Name
            </label>
            <div className="relative flex items-center">
              <input
                id="filename-input"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="recording-name"
                disabled={isSaving}
                className="w-full pl-3 pr-16 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                required
              />
              <span className="absolute right-2.5 px-2 py-0.5 text-[10px] font-bold text-slate-600 bg-slate-200/80 rounded-md uppercase tracking-wider select-none">
                .{format}
              </span>
            </div>
          </div>

          {/* Format Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Video Format</label>
              <span className="text-[10px] text-slate-400">Choose container format</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {availableFormats.map((fmtKey) => {
                const config = FORMAT_CONFIG[fmtKey];
                const isSelected = format === fmtKey;
                return (
                  <button
                    key={fmtKey}
                    type="button"
                    onClick={() => setFormat(fmtKey)}
                    disabled={isSaving}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-rose-500/80 bg-rose-50/50 shadow-xs ring-1 ring-rose-500/30'
                        : 'border-slate-200/80 bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold uppercase transition-colors ${
                          isSelected
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {fmtKey}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-800">
                            {config.label}
                          </span>
                          <span
                            className={`text-[9px] font-medium px-1.5 py-0.2 rounded-md ${
                              isSelected
                                ? 'bg-rose-200/80 text-rose-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {config.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {config.desc}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'border-rose-600 bg-rose-600 text-white'
                          : 'border-slate-300 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* QuickTime Player Compatibility Notice */}
            {blob.type.includes('webm') && (format === 'mp4' || format === 'mov') && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-amber-950">QuickTime Player on Mac Notice:</span>{' '}
                  This recording is encoded with WebM/VP9. QuickTime Player strictly requires Apple H.264/AAC and will reject it. To play on macOS, open with{' '}
                  <span className="font-semibold underline">VLC</span> or{' '}
                  <span className="font-semibold underline">IINA</span> player, or save as{' '}
                  <span className="font-semibold">.webm</span>.
                </div>
              </div>
            )}
          </div>

          {/* Folder Destination Selector */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Save Location & Folder</label>
              <span className="text-[10px] text-slate-400">Desktop, Documents, etc.</span>
            </div>

            {/* Direct Browse Folder Button / Active Selected Folder Card */}
            {selectedDir ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/60 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FolderCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                      Destination Folder
                    </span>
                    <p className="text-xs font-bold text-emerald-950 truncate max-w-[200px]">
                      📁 {selectedDir.name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleBrowseFolder}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-200/70 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-rose-300 bg-rose-50/40 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-all shadow-2xs active:scale-[0.98]"
              >
                <FolderOpen className="w-4 h-4 text-rose-600" />
                <span>Click to Browse & Pick Destination Folder</span>
              </button>
            )}

            {/* Prompt for folder option if not using directory picker */}
            {!selectedDir && (
              <>
                <div
                  onClick={() => setPromptFolder(!promptFolder)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                    promptFolder
                      ? 'border-rose-300 bg-rose-50/30 ring-1 ring-rose-500/20'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors ${
                      promptFolder
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {promptFolder && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold text-slate-800">
                      Or prompt with macOS "Save As" Finder dialog on save
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      When you click <strong>Save as .{format}</strong> below, macOS Finder will open so you can choose where to save.
                    </p>
                  </div>
                </div>

                {/* Subfolder input if not prompting or as fallback */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                      <Folder className="w-3 h-3 text-slate-400" />
                      Downloads subfolder (optional)
                    </span>
                    <span className="text-[10px] text-slate-400">e.g. Recordings</span>
                  </div>
                  <input
                    type="text"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    placeholder="Leave blank for root Downloads folder"
                    disabled={isSaving}
                    className="w-full px-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-slate-400"
                  />
                </div>
              </>
            )}
          </div>

          {/* Modal Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-2xs active:scale-[0.98] transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving || !filename.trim()}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium text-xs shadow-sm shadow-rose-600/20 active:scale-[0.98] transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Save as .{format}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
