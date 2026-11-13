export type MultiplayerRole = 'host' | 'guest';

export interface BlockChangeMessage {
  type: 'block-change';
  x: number;
  y: number;
  z: number;
  blockType: number;
}

export interface PlayerStateMessage {
  type: 'player-state';
  playerId?: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface WorldInitMessage {
  type: 'world-init';
  seed: number;
  worldType: 'normal' | 'superflat';
  mode: 'CREATIVE' | 'SURVIVAL';
  modeLocked: boolean;
  worldBorderEnabled: boolean;
  viewDistance: number;
  fogEnabled: boolean;
  spawn: { x: number; y: number; z: number };
}

export interface BlockHistoryMessage {
  type: 'block-history';
  changes: BlockChangeMessage[];
}

export type MultiplayerGameMessage =
  | BlockChangeMessage
  | PlayerStateMessage
  | WorldInitMessage
  | BlockHistoryMessage;

type SignalMessage =
  | { kind: 'offer' | 'answer'; description: RTCSessionDescriptionInit }
  | { kind: 'candidate'; candidate: RTCIceCandidateInit };

type ServerMessage =
  | { type: 'room-created'; code: string; peerId: string }
  | { type: 'joined'; peerId: string; hostId: string }
  | { type: 'peer-joined'; peerId: string }
  | { type: 'peer-left'; peerId: string }
  | { type: 'signal'; fromId: string; signal: SignalMessage }
  | { type: 'room-closed'; reason: string }
  | { type: 'error'; message: string };

export interface MultiplayerCallbacks {
  onRoomCreated: (code: string) => void;
  onJoined: () => void;
  onPeerConnected: (peerId: string) => void;
  onPeerDisconnected: (peerId: string) => void;
  onData: (peerId: string, message: MultiplayerGameMessage) => void;
  onError: (message: string) => void;
  onRoomClosed: (reason: string) => void;
}

interface PeerConnectionEntry {
  connection: RTCPeerConnection;
  channel: RTCDataChannel | null;
  pendingCandidates: RTCIceCandidateInit[];
}

const STUN_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBlockChange(value: unknown): value is BlockChangeMessage {
  return isRecord(value) && value.type === 'block-change' &&
    Number.isInteger(value.x) && Number.isInteger(value.y) &&
    Number.isInteger(value.z) && Number.isInteger(value.blockType);
}

function isGameMessage(value: unknown): value is MultiplayerGameMessage {
  if (!isRecord(value) || typeof value.type !== 'string') return false;
  if (value.type === 'block-change') return isBlockChange(value);
  if (value.type === 'block-history') {
    return Array.isArray(value.changes) && value.changes.length <= 10_000 &&
      value.changes.every(isBlockChange);
  }
  if (value.type === 'player-state') {
    return Number.isFinite(value.x) && Number.isFinite(value.y) &&
      Number.isFinite(value.z) && Number.isFinite(value.yaw);
  }
  if (value.type === 'world-init') {
    return Number.isInteger(value.seed) &&
      (value.worldType === 'normal' || value.worldType === 'superflat') &&
      (value.mode === 'CREATIVE' || value.mode === 'SURVIVAL') &&
      typeof value.modeLocked === 'boolean' &&
      typeof value.worldBorderEnabled === 'boolean' &&
      Number.isInteger(value.viewDistance) &&
      typeof value.fogEnabled === 'boolean' &&
      isRecord(value.spawn) &&
      Number.isFinite(value.spawn.x) && Number.isFinite(value.spawn.y) &&
      Number.isFinite(value.spawn.z);
  }
  return false;
}

export class MultiplayerSession {
  private socket: WebSocket | null = null;
  private readonly peers = new Map<string, PeerConnectionEntry>();
  private heartbeatTimer: number | null = null;
  private closedByUser = false;
  private hostId: string | null = null;
  private role: MultiplayerRole | null = null;
  localPlayerId = '';

  constructor(private readonly callbacks: MultiplayerCallbacks) {}

  createRoom(): Promise<string> {
    this.role = 'host';
    return this.openSignalingSocket('host').then(result => result.code ?? '');
  }

  joinRoom(code: string): Promise<void> {
    this.role = 'guest';
    return this.openSignalingSocket('guest', code).then(() => undefined);
  }

  private openSignalingSocket(
    role: MultiplayerRole,
    code?: string,
  ): Promise<{ code?: string; peerId: string }> {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const query = new URLSearchParams({ role });
    if (code) query.set('code', code);

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(`${protocol}//${window.location.host}/api/multiplayer?${query}`);
      this.socket = socket;
      let settled = false;

      socket.onopen = () => {
        this.heartbeatTimer = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'heartbeat' }));
        }, 25_000);
      };

      socket.onmessage = event => {
        let message: ServerMessage;
        try {
          message = JSON.parse(String(event.data)) as ServerMessage;
        } catch {
          this.callbacks.onError('Die Antwort des Verbindungsdienstes war ungültig.');
          return;
        }

        if (message.type === 'error') {
          this.callbacks.onError(message.message);
          if (!settled) {
            settled = true;
            reject(new Error(message.message));
          }
          return;
        }
        if (message.type === 'room-created') {
          this.localPlayerId = message.peerId;
          this.callbacks.onRoomCreated(message.code);
          if (!settled) {
            settled = true;
            resolve({ code: message.code, peerId: message.peerId });
          }
          return;
        }
        if (message.type === 'joined') {
          this.localPlayerId = message.peerId;
          this.hostId = message.hostId;
          this.callbacks.onJoined();
          if (!settled) {
            settled = true;
            resolve({ peerId: message.peerId });
          }
          return;
        }
        if (message.type === 'peer-joined' && this.role === 'host') {
          void this.ensurePeer(message.peerId, true);
          return;
        }
        if (message.type === 'peer-left') {
          this.removePeer(message.peerId);
          return;
        }
        if (message.type === 'room-closed') {
          this.callbacks.onRoomClosed(message.reason);
          return;
        }
        if (message.type === 'signal') {
          const peerId = this.role === 'guest' ? this.hostId ?? message.fromId : message.fromId;
          void this.handleSignal(peerId, message.signal);
        }
      };

      socket.onerror = () => {
        const error = new Error('Der Verbindungsdienst ist gerade nicht erreichbar.');
        this.callbacks.onError(error.message);
        if (!settled) {
          settled = true;
          reject(error);
        }
      };

      socket.onclose = event => {
        this.clearHeartbeat();
        if (!this.closedByUser && event.code !== 1000) {
          this.callbacks.onRoomClosed('Die Verbindung zum Verbindungsdienst wurde getrennt.');
        }
        if (!settled) {
          settled = true;
          reject(new Error('Die Verbindung wurde vorzeitig geschlossen.'));
        }
      };
    });
  }

  private async ensurePeer(peerId: string, initiator: boolean): Promise<PeerConnectionEntry> {
    const existing = this.peers.get(peerId);
    if (existing) return existing;

    const connection = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    const entry: PeerConnectionEntry = {
      connection,
      channel: null,
      pendingCandidates: [],
    };
    this.peers.set(peerId, entry);

    connection.onicecandidate = event => {
      if (event.candidate) {
        this.sendSignal(peerId, { kind: 'candidate', candidate: event.candidate.toJSON() });
      }
    };
    connection.ondatachannel = event => this.attachDataChannel(peerId, entry, event.channel);
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'failed') {
        this.callbacks.onError('Direkte Verbindung fehlgeschlagen. Dieses Netzwerk benötigt möglicherweise eine Relay-Verbindung.');
        this.removePeer(peerId);
      }
    };
    connection.oniceconnectionstatechange = () => {
      if (connection.iceConnectionState === 'failed') {
        this.callbacks.onError('WebRTC konnte keine direkte Verbindung herstellen.');
      }
    };

    if (initiator) {
      this.attachDataChannel(peerId, entry, connection.createDataChannel('tipecraft-game'));
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      if (connection.localDescription) {
        this.sendSignal(peerId, { kind: 'offer', description: connection.localDescription.toJSON() });
      }
    }
    return entry;
  }

  private async handleSignal(peerId: string, signal: SignalMessage): Promise<void> {
    try {
      const entry = await this.ensurePeer(peerId, false);
      if (signal.kind === 'candidate') {
        if (entry.connection.remoteDescription) {
          await entry.connection.addIceCandidate(signal.candidate);
        } else {
          entry.pendingCandidates.push(signal.candidate);
        }
        return;
      }

      await entry.connection.setRemoteDescription(signal.description);
      for (const candidate of entry.pendingCandidates.splice(0)) {
        await entry.connection.addIceCandidate(candidate);
      }

      if (signal.kind === 'offer') {
        const answer = await entry.connection.createAnswer();
        await entry.connection.setLocalDescription(answer);
        if (entry.connection.localDescription) {
          this.sendSignal(peerId, { kind: 'answer', description: entry.connection.localDescription.toJSON() });
        }
      }
    } catch {
      this.callbacks.onError('Beim Aushandeln der direkten Spielverbindung ist ein Fehler aufgetreten.');
    }
  }

  private attachDataChannel(peerId: string, entry: PeerConnectionEntry, channel: RTCDataChannel): void {
    entry.channel = channel;
    channel.onopen = () => this.callbacks.onPeerConnected(peerId);
    channel.onclose = () => {
      if (entry.channel === channel) {
        entry.channel = null;
        this.callbacks.onPeerDisconnected(peerId);
      }
    };
    channel.onerror = () => this.callbacks.onError('Die Datenverbindung zu einem Mitspieler wurde unterbrochen.');
    channel.onmessage = event => {
      if (typeof event.data !== 'string' || event.data.length > 256_000) return;
      let message: unknown;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!isGameMessage(message)) return;

      let normalized: MultiplayerGameMessage = message;
      if (this.role === 'host' && normalized.type === 'player-state') {
        normalized = { ...normalized, playerId: peerId };
      }
      if (this.role === 'host' && (normalized.type === 'player-state' || normalized.type === 'block-change')) {
        this.sendToAll(normalized);
      }
      this.callbacks.onData(peerId, normalized);
    };
  }

  private sendSignal(targetId: string, signal: SignalMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'signal', targetId, signal }));
    }
  }

  sendToPlayer(peerId: string, message: MultiplayerGameMessage): void {
    const channel = this.peers.get(peerId)?.channel;
    if (channel?.readyState === 'open') channel.send(JSON.stringify(message));
  }

  sendToAll(message: MultiplayerGameMessage): void {
    if (this.role === 'guest' && this.hostId) {
      this.sendToPlayer(this.hostId, message);
      return;
    }
    for (const entry of this.peers.values()) {
      if (entry.channel?.readyState === 'open') entry.channel.send(JSON.stringify(message));
    }
  }

  private removePeer(peerId: string): void {
    const entry = this.peers.get(peerId);
    if (!entry) return;
    entry.channel?.close();
    entry.connection.close();
    this.peers.delete(peerId);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  close(): void {
    this.closedByUser = true;
    this.clearHeartbeat();
    for (const peerId of this.peers.keys()) this.removePeer(peerId);
    this.socket?.close(1000, 'Session ended');
    this.socket = null;
  }
}
