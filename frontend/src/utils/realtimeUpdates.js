const realtimeListeners = new Set();

let realtimeEventSource = null;
let reconnectTimerId = null;
let connectionUrlIndex = 0;

function buildRealtimeStreamUrls() {
  const configuredBase = String(import.meta.env.VITE_API_URL || '/api').trim();
  const normalizedBase = configuredBase.replace(/\/+$/, '') || '/api';

  const candidates = [
    `${normalizedBase}/realtime/stream`,
    '/api/realtime/stream',
  ];

  return Array.from(new Set(candidates.map((item) => String(item || '').trim()).filter(Boolean)));
}

function clearReconnectTimer() {
  if (reconnectTimerId) {
    clearTimeout(reconnectTimerId);
    reconnectTimerId = null;
  }
}

function notifyListeners(payload) {
  realtimeListeners.forEach((listener) => {
    try {
      listener(payload);
    } catch {
      // Ignore listener runtime errors to avoid breaking the stream.
    }
  });
}

function closeRealtimeConnection() {
  clearReconnectTimer();

  if (realtimeEventSource) {
    realtimeEventSource.close();
    realtimeEventSource = null;
  }
}

function scheduleReconnect() {
  if (!realtimeListeners.size || reconnectTimerId) {
    return;
  }

  reconnectTimerId = setTimeout(() => {
    reconnectTimerId = null;
    ensureRealtimeConnection();
  }, 2000);
}

function handleRealtimePayload(event) {
  let payload = {};

  try {
    payload = event?.data ? JSON.parse(event.data) : {};
  } catch {
    payload = {};
  }

  notifyListeners(payload);
}

function ensureRealtimeConnection() {
  if (!realtimeListeners.size) {
    return;
  }

  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return;
  }

  if (realtimeEventSource) {
    return;
  }

  clearReconnectTimer();

  const streamCandidates = buildRealtimeStreamUrls();
  const streamUrl = streamCandidates[connectionUrlIndex % streamCandidates.length];
  realtimeEventSource = new EventSource(streamUrl, { withCredentials: true });

  realtimeEventSource.addEventListener('platform-update', handleRealtimePayload);
  realtimeEventSource.onmessage = handleRealtimePayload;

  realtimeEventSource.onerror = () => {
    closeRealtimeConnection();
    connectionUrlIndex = (connectionUrlIndex + 1) % Math.max(1, streamCandidates.length);
    scheduleReconnect();
  };
}

export function subscribeRealtimeUpdates(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  realtimeListeners.add(listener);
  ensureRealtimeConnection();

  return () => {
    realtimeListeners.delete(listener);

    if (!realtimeListeners.size) {
      closeRealtimeConnection();
    }
  };
}
