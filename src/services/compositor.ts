import { CameraOverlayConfig } from '../types/recording';

export interface CanvasCompositor {
  stream: MediaStream;
  stop: () => void;
  setOverlayConfig: (config: Partial<CameraOverlayConfig>) => void;
  getOverlayConfig: () => CameraOverlayConfig;
}

export const DEFAULT_OVERLAY_CONFIG: CameraOverlayConfig = {
  position: 'bottom-right',
  sizeRatio: 0.22, // 22% of recording width
  shape: 'circle',
};

/**
 * Combines screen stream and camera stream into a single canvas-rendered MediaStream.
 */
export async function createCompositorStream(
  screenStream: MediaStream,
  cameraStream: MediaStream,
  overlayConfig: CameraOverlayConfig = DEFAULT_OVERLAY_CONFIG
): Promise<CanvasCompositor> {
  // Offscreen screen video element
  const screenVideo = document.createElement('video');
  screenVideo.srcObject = screenStream;
  screenVideo.muted = true;
  screenVideo.playsInline = true;
  screenVideo.autoplay = true;

  // Offscreen camera video element
  const cameraVideo = document.createElement('video');
  cameraVideo.srcObject = cameraStream;
  cameraVideo.muted = true;
  cameraVideo.playsInline = true;
  cameraVideo.autoplay = true;

  // Wait for metadata to ensure dimensions are ready
  await Promise.all([
    new Promise<void>((resolve) => {
      if (screenVideo.readyState >= 2) return resolve();
      screenVideo.onloadedmetadata = () => resolve();
    }),
    new Promise<void>((resolve) => {
      if (cameraVideo.readyState >= 2) return resolve();
      cameraVideo.onloadedmetadata = () => resolve();
    }),
  ]);

  try {
    await Promise.all([screenVideo.play(), cameraVideo.play()]);
  } catch (err) {
    console.warn('Playback error in compositor setup:', err);
  }

  // Create canvas matching the native screen resolution
  const canvas = document.createElement('canvas');
  const width = screenVideo.videoWidth || 1920;
  const height = screenVideo.videoHeight || 1080;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) {
    throw new Error('Failed to create 2D canvas rendering context.');
  }

  let animationFrameId: number | null = null;
  let isActive = true;
  let currentOverlayConfig: CameraOverlayConfig = { ...overlayConfig };

  const setOverlayConfig = (newConfig: Partial<CameraOverlayConfig>) => {
    currentOverlayConfig = {
      ...currentOverlayConfig,
      ...newConfig,
    };
  };

  const getOverlayConfig = (): CameraOverlayConfig => ({ ...currentOverlayConfig });

  const renderFrame = () => {
    if (!isActive) return;

    // 1. Draw screen video
    if (screenVideo.readyState >= 2) {
      ctx.drawImage(screenVideo, 0, 0, width, height);
    }

    // 2. Calculate camera overlay geometry
    if (cameraVideo.readyState >= 2 && currentOverlayConfig.enabled !== false) {
      const overlayWidth = Math.round(width * currentOverlayConfig.sizeRatio);
      const camAspect = (cameraVideo.videoWidth && cameraVideo.videoHeight)
        ? (cameraVideo.videoWidth / cameraVideo.videoHeight)
        : 16 / 9;

      let overlayHeight = Math.round(overlayWidth / camAspect);
      if (currentOverlayConfig.shape === 'circle') {
        overlayHeight = overlayWidth; // 1:1 circle
      }

      const margin = Math.round(width * 0.02); // 2% margin from edges

      let x = width - overlayWidth - margin;
      let y = height - overlayHeight - margin;

      if (currentOverlayConfig.position === 'bottom-left') {
        x = margin;
        y = height - overlayHeight - margin;
      } else if (currentOverlayConfig.position === 'top-right') {
        x = width - overlayWidth - margin;
        y = margin;
      } else if (currentOverlayConfig.position === 'top-left') {
        x = margin;
        y = margin;
      }

      ctx.save();

      if (currentOverlayConfig.shape === 'circle') {
        const radius = overlayWidth / 2;
        const centerX = x + radius;
        const centerY = y + radius;

        // Shadow & Border
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        // Clip circular path
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
        ctx.clip();

        // Center-crop camera feed into the circle
        const minDim = Math.min(cameraVideo.videoWidth, cameraVideo.videoHeight);
        const sx = (cameraVideo.videoWidth - minDim) / 2;
        const sy = (cameraVideo.videoHeight - minDim) / 2;
        ctx.drawImage(cameraVideo, sx, sy, minDim, minDim, x, y, overlayWidth, overlayHeight);
      } else {
        // Rounded rectangle overlay
        const cornerRadius = 16;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.roundRect(x, y, overlayWidth, overlayHeight, cornerRadius);
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(x, y, overlayWidth, overlayHeight, cornerRadius);
        ctx.clip();

        ctx.drawImage(cameraVideo, 0, 0, overlayWidth, overlayHeight);
      }

      ctx.restore();
    }

    animationFrameId = requestAnimationFrame(renderFrame);
  };

  // Start rendering loop
  animationFrameId = requestAnimationFrame(renderFrame);

  // Capture canvas stream at 30 FPS
  const canvasStream = canvas.captureStream(30);

  const stop = () => {
    isActive = false;
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    screenVideo.pause();
    cameraVideo.pause();
    screenVideo.srcObject = null;
    cameraVideo.srcObject = null;
  };

  return {
    stream: canvasStream,
    stop,
    setOverlayConfig,
    getOverlayConfig,
  };
}
