export interface FloatingCameraHandle {
  close: () => void;
  isOpen: () => boolean;
}

let activePipWindow: Window | null = null;
let activePipVideo: HTMLVideoElement | null = null;

/**
 * Opens an Always-On-Top floating camera bubble on the user's screen
 * that can be dragged anywhere with the mouse cursor while recording.
 */
export async function openFloatingCamera(
  stream: MediaStream,
  onClose?: () => void
): Promise<FloatingCameraHandle> {
  // If already open, close previous instance
  closeFloatingCamera();

  // Approach 1: Chrome 116+ Document Picture-in-Picture (Custom Always-On-Top Floating HTML Window)
  if (typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
    try {
      const pip = (window as unknown as {
        documentPictureInPicture: {
          requestWindow: (options: { width: number; height: number }) => Promise<Window>;
        };
      }).documentPictureInPicture;

      const pipWindow = await pip.requestWindow({
        width: 220,
        height: 220,
      });

      activePipWindow = pipWindow;
      pipWindow.document.title = 'Camera Bubble (Drag to move)';

      // Inject clean, modern circular camera styling
      const style = pipWindow.document.createElement('style');
      style.textContent = `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: #0f172a;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          width: 100vw;
          user-select: none;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .bubble-wrapper {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }
        .bubble-frame {
          width: min(calc(100vw - 12px), calc(100vh - 12px));
          height: min(calc(100vw - 12px), calc(100vh - 12px));
          border-radius: 50%;
          overflow: hidden;
          border: 3.5px solid #f43f5e;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.7);
          background: #000;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }
        .rec-tag {
          position: absolute;
          bottom: 10px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(4px);
          color: #f43f5e;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 12px;
          border: 1px solid rgba(244, 63, 94, 0.4);
          display: flex;
          align-items: center;
          gap: 4px;
          letter-spacing: 0.5px;
          pointer-events: none;
        }
        .rec-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #f43f5e;
          animation: pulse 1.4s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(0.85); }
        }
      `;
      pipWindow.document.head.appendChild(style);

      const wrapper = pipWindow.document.createElement('div');
      wrapper.className = 'bubble-wrapper';

      const frame = pipWindow.document.createElement('div');
      frame.className = 'bubble-frame';

      const video = pipWindow.document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;

      const tag = pipWindow.document.createElement('div');
      tag.className = 'rec-tag';
      const dot = pipWindow.document.createElement('span');
      dot.className = 'rec-dot';
      const text = pipWindow.document.createTextNode('REC');
      tag.appendChild(dot);
      tag.appendChild(text);

      frame.appendChild(video);
      frame.appendChild(tag);
      wrapper.appendChild(frame);
      pipWindow.document.body.appendChild(wrapper);

      pipWindow.addEventListener('pagehide', () => {
        activePipWindow = null;
        onClose?.();
      });

      return {
        close: () => closeFloatingCamera(),
        isOpen: () => activePipWindow !== null,
      };
    } catch (err) {
      console.warn('Document Picture-in-Picture request failed, falling back to standard video PiP:', err);
    }
  }

  // Approach 2: Standard HTMLVideoElement Picture-in-Picture fallback
  try {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.position = 'fixed';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    document.body.appendChild(video);

    await video.play();
    await video.requestPictureInPicture();
    activePipVideo = video;

    const cleanup = () => {
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      activePipVideo = null;
      onClose?.();
    };

    video.addEventListener('leavepictureinpicture', cleanup);

    return {
      close: () => closeFloatingCamera(),
      isOpen: () => document.pictureInPictureElement !== null,
    };
  } catch (err) {
    console.error('Picture-in-Picture failed completely:', err);
    throw err;
  }
}

/**
 * Closes any active floating camera window or picture-in-picture session.
 */
export function closeFloatingCamera(): void {
  if (activePipWindow) {
    try {
      activePipWindow.close();
    } catch (_) {}
    activePipWindow = null;
  }
  if (typeof document !== 'undefined' && document.pictureInPictureElement) {
    try {
      document.exitPictureInPicture();
    } catch (_) {}
  }
  if (activePipVideo) {
    if (activePipVideo.parentNode) {
      activePipVideo.parentNode.removeChild(activePipVideo);
    }
    activePipVideo = null;
  }
}

export function isFloatingCameraActive(): boolean {
  return activePipWindow !== null || (typeof document !== 'undefined' && document.pictureInPictureElement !== null);
}
