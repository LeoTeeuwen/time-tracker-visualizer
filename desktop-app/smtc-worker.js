const { parentPort } = require('worker_threads');
const { SMTCMonitor } = require('@coooookies/windows-smtc-monitor'); 

// Windows WinRT PlaybackStatus Enum: 4 = Playing
const WINDOWS_PLAYING_ENUM = 4;

function checkAllWindowsMedia() {
  try {
    // 1. Fetch ALL registered media loops on the operating system
    const allSessions = SMTCMonitor.getMediaSessions() || [];
    
    // 2. Isolate ONLY the applications that are actively playing right now
    const activeSessions = allSessions
      .filter(session => session.playback?.playbackStatus === WINDOWS_PLAYING_ENUM)
      .map(session => ({
        sourceApp: session.sourceAppId,         // e.g., "Spotify.exe", "chrome.exe"
        title: session.media?.title || "Unknown Track",
        artist: session.media?.artist || "Unknown Artist"
      }));

    // 3. Emit the array of all competing playback streams back to the main thread
    parentPort.postMessage({
      isMediaActive: activeSessions.length > 0,
      activeSources: activeSessions
    });
  } catch (error) {
    parentPort.postMessage({ isMediaActive: false, activeSources: [], error: error.message });
  }
}

// Poll the Windows Session Manager layer every 2 seconds
setInterval(checkAllWindowsMedia, 2000);