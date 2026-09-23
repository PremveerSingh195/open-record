/**
 * Background Service Worker for Screen & Camera Recorder.
 * 
 * Chrome extension popups (action.default_popup) automatically terminate
 * the moment they lose focus (such as when the user clicks "Share" on the
 * native screen picker or switches windows).
 * 
 * To ensure recordings never get abruptly terminated, clicking the extension
 * action icon opens a persistent, dedicated recorder window (type: 'popup')
 * that stays open across window switches and screen-sharing interactions.
 */

let recorderWindowId: number | null = null;

chrome.action.onClicked.addListener(async () => {
  // If the recorder window is already open, focus it
  if (recorderWindowId !== null) {
    try {
      const existingWindow = await chrome.windows.get(recorderWindowId);
      if (existingWindow && existingWindow.id) {
        await chrome.windows.update(existingWindow.id, { focused: true });
        return;
      }
    } catch {
      recorderWindowId = null;
    }
  }

  // Open dedicated persistent recorder window
  try {
    const newWindow = await chrome.windows.create({
      url: chrome.runtime.getURL('index.html'),
      type: 'popup',
      width: 440,
      height: 660,
      focused: true,
    });

    recorderWindowId = newWindow.id ?? null;
  } catch (err) {
    console.error('Failed to create recorder window:', err);
    // Fallback: open in new tab if window creation fails
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
  }
});

// Reset window ID when closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === recorderWindowId) {
    recorderWindowId = null;
  }
});
