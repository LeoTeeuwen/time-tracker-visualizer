const { parentPort } = require('worker_threads');
// Import the native N-API Windows binding layer
const { SMTCMonitor } = require('@coooookies/windows-smtc-monitor'); 

// Windows WinRT PlaybackStatus Enum Key:
// 0 = Closed, 1 = Opened, 2 = Changing, 3 = Stopped, 4 = Playing, 5 = Paused
const WINDOWS_PLAYING_ENUM = 4;

function checkWindowsMedia() {

    try {
    // Queries the GlobalSystemMediaTransportControlsSessionManager
    const currentSession = SMTCMonitor.getCurrentMediaSession();
    if (currentSession && currentSession.playback?.playbackStatus === WINDOWS_PLAYING_ENUM) {
      // Send active media properties back to the main thread
      parentPort.postMessage({
        isMediaActive: true,
        sourceApp: currentSession.sourceAppId, // e.g., "chrome.exe", "Spotify.exe"
        title: currentSession.media?.title || "Unknown Session"
      });
    } else {
      parentPort.postMessage({ isMediaActive: false });
    }
  } catch (error) {
    parentPort.postMessage({ isMediaActive: false, error: error.message });
  }
}

// Poll the Windows Media Manager every 2 seconds
setInterval(checkWindowsMedia, 2000);