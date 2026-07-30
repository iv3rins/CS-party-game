import type { GameState, ProductKind, Side } from './engine.js';

export type OnlineSnapshot = {
  sequence: number;
  yourSide: 'ct' | 't';
  state: GameState;
  shops: Record<Side, ProductKind[]>;
  connected: Record<Side, boolean>;
};

export type ClientMessage =
  | { type: 'match.subscribe'; matchId: string; lastSequence?: number }
  | { type: 'match.command'; matchId: string; commandId: string; command: MatchCommand }
  | { type: 'ping'; clientTime: number };

export type MatchCommand =
  | { type: 'buy_deploy'; slot: number; lane: number }
  | { type: 'use_item'; slot: number; lane: number }
  | { type: 'forfeit' };

export type ServerMessage =
  | { type: 'session.ready'; accountId: string }
  | { type: 'match.snapshot'; sequence: number; yourSide: 'ct' | 't'; match: Omit<OnlineSnapshot, 'yourSide'> }
  | { type: 'command.accepted'; commandId: string; sequence: number }
  | { type: 'command.rejected'; commandId: string; code: string; message: string }
  | { type: 'match.finished'; result: { matchId: string; outcome: 'ct' | 't' | 'draw'; reason: string; finishedAt: string } }
  | { type: 'match.connection'; principalId: string; connected: boolean; reconnectDeadline?: string }
  | { type: 'pong'; clientTime: number; serverTime: number };

export type CommandStatus = 'pending' | 'accepted' | 'rejected';

export class OnlineMatchClient {
  private ws: WebSocket | null = null;
  private snapshot: OnlineSnapshot | null = null;
  private pendingCommands = new Map<string, { status: CommandStatus; error?: string }>();
  private listeners = {
    snapshot: [] as Array<(snapshot: OnlineSnapshot) => void>,
    finished: [] as Array<(result: ServerMessage & { type: 'match.finished' }) => void>,
    commandStatus: [] as Array<(commandId: string, status: CommandStatus, error?: string) => void>,
    connection: [] as Array<(principalId: string, connected: boolean, deadline?: string) => void>,
    error: [] as Array<(error: Error) => void>,
  };

  constructor(
    private matchId: string,
    private wsUrl: string = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`,
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => {
        this.send({ type: 'match.subscribe', matchId: this.matchId });
        resolve();
      };
      this.ws.onerror = () => reject(new Error('WebSocket 连接失败'));
      this.ws.onmessage = event => this.handleMessage(JSON.parse(event.data));
      this.ws.onclose = () => this.emit('error', new Error('连接已断开'));
    });
  }

  private handleMessage(message: ServerMessage) {
    if (message.type === 'match.snapshot') {
      const snapshot = { ...message.match, yourSide: message.yourSide };
      this.snapshot = snapshot;
      this.emit('snapshot', snapshot);
    } else if (message.type === 'command.accepted') {
      this.pendingCommands.set(message.commandId, { status: 'accepted' });
      this.emit('commandStatus', message.commandId, 'accepted');
    } else if (message.type === 'command.rejected') {
      this.pendingCommands.set(message.commandId, { status: 'rejected', error: message.message });
      this.emit('commandStatus', message.commandId, 'rejected', message.message);
    } else if (message.type === 'match.finished') {
      this.emit('finished', message);
    } else if (message.type === 'match.connection') {
      this.emit('connection', message.principalId, message.connected, message.reconnectDeadline);
    }
  }

  sendCommand(commandId: string, command: MatchCommand) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.emit('commandStatus', commandId, 'rejected', '连接已断开');
      return;
    }
    this.pendingCommands.set(commandId, { status: 'pending' });
    this.send({ type: 'match.command', matchId: this.matchId, commandId, command });
  }

  getCommandStatus(commandId: string): CommandStatus | undefined {
    return this.pendingCommands.get(commandId)?.status;
  }

  getSnapshot(): OnlineSnapshot | null {
    return this.snapshot;
  }

  onSnapshot(callback: (snapshot: OnlineSnapshot) => void) {
    this.listeners.snapshot.push(callback);
  }

  onFinished(callback: (result: ServerMessage & { type: 'match.finished' }) => void) {
    this.listeners.finished.push(callback);
  }

  onCommandStatus(callback: (commandId: string, status: CommandStatus, error?: string) => void) {
    this.listeners.commandStatus.push(callback);
  }

  onConnection(callback: (principalId: string, connected: boolean, deadline?: string) => void) {
    this.listeners.connection.push(callback);
  }

  onError(callback: (error: Error) => void) {
    this.listeners.error.push(callback);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private emit<K extends keyof typeof this.listeners>(event: K, ...args: Parameters<(typeof this.listeners)[K][number]>) {
    for (const listener of this.listeners[event]) {
      (listener as (...args: unknown[]) => void)(...args);
    }
  }
}
