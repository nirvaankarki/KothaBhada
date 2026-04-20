const realtimeClients = new Set();
let realtimeClientSequence = 1;

function writeSseEvent(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function unregisterRealtimeClient(client, heartbeatId) {
  if (heartbeatId) {
    clearInterval(heartbeatId);
  }

  realtimeClients.delete(client);
}

export function registerRealtimeClient(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const client = {
    id: realtimeClientSequence++,
    res,
  };

  realtimeClients.add(client);

  writeSseEvent(res, 'connected', {
    clientId: client.id,
    timestamp: new Date().toISOString(),
  });

  const heartbeatId = setInterval(() => {
    if (res.writableEnded) {
      unregisterRealtimeClient(client, heartbeatId);
      return;
    }

    res.write(': keepalive\n\n');
  }, 25000);

  req.on('close', () => {
    unregisterRealtimeClient(client, heartbeatId);
  });
}

export function broadcastRealtimeEvent(eventName = 'platform-update', payload = {}) {
  if (!realtimeClients.size) {
    return;
  }

  const eventPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  };

  Array.from(realtimeClients).forEach((client) => {
    try {
      if (!client?.res || client.res.writableEnded) {
        unregisterRealtimeClient(client);
        return;
      }

      writeSseEvent(client.res, eventName, eventPayload);
    } catch {
      unregisterRealtimeClient(client);
    }
  });
}
