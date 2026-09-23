import React from 'react';
import { Video, ExternalLink } from 'lucide-react';

interface HeaderProps {
  isRecording?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isRecording }) => {
  const handleOpenInTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <header className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200/80">
      <div className="flex items-center space-x-2.5">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600">
          <Video className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-slate-800 leading-tight">
            Screen Recorder
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            {isRecording ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                Live Recording
              </span>
            ) : (
              'Local & Private'
            )}
          </p>
        </div>
      </div>

      <button
        onClick={handleOpenInTab}
        title="Open in standalone tab / window"
        aria-label="Open in standalone tab or window"
        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
      </button>
    </header>
  );
};
