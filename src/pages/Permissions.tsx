import React, { useState } from 'react';
import { Camera, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, ShieldAlert } from 'lucide-react';
import { stopMediaStream } from '../services/media';

interface PermissionsPageProps {
  onContinue: () => void;
}

export const PermissionsPage: React.FC<PermissionsPageProps> = ({ onContinue }) => {
  const [status, setStatus] = useState<'prompt' | 'requesting' | 'granted' | 'denied'>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestPermissions = async () => {
    setStatus('requesting');
    setErrorMessage(null);

    try {
      // Prompt for both video and audio in this tab context
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Stop stream immediately once permission is granted
      stopMediaStream(stream);
      setStatus('granted');
    } catch (err: unknown) {
      console.warn('Permission request error:', err);
      const isDenied = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      setStatus('denied');
      setErrorMessage(
        isDenied
          ? 'Permission was denied. Please allow access in Chrome or check macOS System Settings.'
          : (err instanceof Error ? err.message : 'Failed to obtain camera access.')
      );
    }
  };

  const handleCloseTab = () => {
    window.close();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-6 text-white text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 shadow-inner">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold">Camera & Microphone Access</h1>
          <p className="text-xs text-rose-100 mt-1">
            Required for Screen + Camera and Webcam recording
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {status === 'granted' ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Permission Granted Successfully!
                </h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Chrome has permanently enabled camera and microphone access for Screen Recorder.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onContinue}
                  className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-all shadow-md shadow-rose-600/20 active:scale-[0.98]"
                >
                  Start Recording in this Tab
                </button>
                <button
                  type="button"
                  onClick={handleCloseTab}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-all"
                >
                  Close Tab & Return to Extension Popup
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-slate-600 text-xs space-y-2 leading-relaxed">
                <p>
                  Google Chrome does not allow camera permission prompts inside popup bubbles.
                  Click the button below to allow access from this browser tab.
                </p>
              </div>

              {/* Status Alert */}
              {status === 'denied' && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-rose-900">Access Blocked</p>
                      <p className="text-rose-700 mt-0.5">{errorMessage}</p>
                    </div>
                  </div>

                  {/* macOS instructions */}
                  <div className="mt-2 pt-2 border-t border-rose-200/80 text-[11px] text-rose-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      For macOS Users:
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5 text-rose-800 pl-1">
                      <li>Open <strong>Apple Menu  → System Settings</strong></li>
                      <li>Go to <strong>Privacy & Security → Camera</strong></li>
                      <li>Ensure toggle next to <strong>Google Chrome</strong> is <strong>ON</strong></li>
                      <li>Also check <strong>Microphone</strong> if using audio</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={requestPermissions}
                  disabled={status === 'requesting'}
                  className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-medium text-xs shadow-md transition-all active:scale-[0.98] ${
                    status === 'requesting'
                      ? 'bg-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20'
                  }`}
                >
                  {status === 'requesting' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Waiting for permission prompt...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>{status === 'denied' ? 'Try Granting Permission Again' : 'Grant Camera & Mic Access'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Troubleshooting Footer */}
              <div className="pt-2 border-t border-slate-100 text-center">
                <a
                  href="chrome://settings/content/camera"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Chrome Site Settings (chrome://settings/content/camera)</span>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
