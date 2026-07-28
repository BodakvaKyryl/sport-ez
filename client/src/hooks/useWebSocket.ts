import { useCallback, useEffect, useState } from "react";

import { WS_BASE_URL } from "../constants";
import type { ClientMessage, ConnectionStatus, ServerMessage } from "../types";

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;
let reconnectAttempt = 0;

let ws: WebSocket | null = null;
let socketStatus: ConnectionStatus = "disconnected";
const messageListeners = new Set<(message: ServerMessage) => void>();
const statusListeners = new Set<(status: ConnectionStatus) => void>();

const desiredSubscriptions = new Set<number>();

function setStatus(status: ConnectionStatus) {
  socketStatus = status;
  statusListeners.forEach((listen) => listen(status));
}

function connect() {
  if (ws) return;

  setStatus("connecting");
  ws = new WebSocket(WS_BASE_URL);

  ws.onopen = () => {
    setStatus("connected");
    reconnectAttempt = 0;
    desiredSubscriptions.forEach((matchId) => {
      ws?.send(JSON.stringify({ type: "subscribe", matchId }));
    });
  };

  ws.onmessage = (event) => {
    const message: ServerMessage = JSON.parse(event.data);
    messageListeners.forEach((listen) => listen(message));
  };

  ws.onclose = () => {
    ws = null;
    setStatus("reconnecting");
    scheduleReconnect();
  };

  ws.onerror = () => ws?.close();
}

function scheduleReconnect() {
  if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
    setStatus("disconnected");
    return;
  }

  const delay = Math.min(BASE_DELAY_MS * 2 ** reconnectAttempt, MAX_DELAY_MS);
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  reconnectAttempt += 1;

  setTimeout(connect, delay + jitter);
}

export function useWebSocket() {
  const [status, setLocalStatus] = useState<ConnectionStatus>(socketStatus);

  useEffect(() => {
    connect();
    statusListeners.add(setLocalStatus);
    return () => {
      statusListeners.delete(setLocalStatus);
    };
  }, []);

  const onMessage = useCallback((handler: (message: ServerMessage) => void) => {
    messageListeners.add(handler);
    return () => {
      messageListeners.delete(handler);
    };
  }, []);

  const send = useCallback((message: ClientMessage) => {
    if (message.type === "subscribe") desiredSubscriptions.add(message.matchId);
    else desiredSubscriptions.delete(message.matchId);

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttempt = 0;
    connect();
  }, []);

  return { status, onMessage, send, reconnect };
}
