import type { WSMessage } from '../types';

type MessageHandler = (msg: WSMessage) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private topic: string = 'all';
  private url: string;

  constructor() {
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';
  }

  connect(topic = 'all') {
    this.topic = topic;
    this._connect();
  }

  private _connect() {
    try {
      this.socket = new WebSocket(`${this.url}/${this.topic}`);

      this.socket.onopen = () => {
        console.log('[WS] Connected to', this.topic);
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this.handlers.forEach((h) => h(msg));
        } catch {
          // ignore parse errors
        }
      };

      this.socket.onclose = () => {
        console.log('[WS] Disconnected — reconnecting in 3s');
        this.reconnectTimer = setTimeout(() => this._connect(), 3000);
      };

      this.socket.onerror = () => {
        this.socket?.close();
      };
    } catch {
      this.reconnectTimer = setTimeout(() => this._connect(), 3000);
    }
  }

  subscribe(handler: MessageHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(data: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  ping() {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send('ping');
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
  }

  get isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
