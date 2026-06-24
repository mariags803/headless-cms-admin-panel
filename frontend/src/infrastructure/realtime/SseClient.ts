import type { DomainEvent } from '../../domain/events/DomainEvent';

type Listener = (event: DomainEvent) => void;
export type ConnectionStatus = 'connecting' | 'open' | 'closed';
type StatusListener = (status: ConnectionStatus) => void;

const DEFAULT_URL = 'http://localhost:3001/events';

export class SseClient {
  private readonly listeners = new Set<Listener>();
  private readonly statusListeners = new Set<StatusListener>();
  private source: EventSource | null = null;
  private status: ConnectionStatus = 'connecting';

  private readonly url: string;
  private readonly EventSourceCtor: new (url: string) => EventSource;

  constructor(
    url: string = DEFAULT_URL,
    EventSourceCtor: new (url: string) => EventSource = EventSource
  ) {
    this.url = url;
    this.EventSourceCtor = EventSourceCtor;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.connect();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.disconnect();
      }
    };
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  private connect(): void {
    if (this.source) return;
    this.setStatus('connecting');
    this.source = new this.EventSourceCtor(this.url);
    this.source.onopen = () => this.setStatus('open');
    this.source.onerror = () => this.setStatus('closed');
    this.source.onmessage = (event) => {
      const domainEvent = JSON.parse(event.data) as DomainEvent;
      for (const listener of this.listeners) {
        listener(domainEvent);
      }
    };
  }

  private disconnect(): void {
    this.source?.close();
    this.source = null;
    this.setStatus('connecting');
  }
}
