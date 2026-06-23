import type { DomainEvent } from '../../domain/events/DomainEvent';

type Listener = (event: DomainEvent) => void;

const DEFAULT_URL = 'http://localhost:3001/events';

export class SseClient {
  private readonly listeners = new Set<Listener>();
  private source: EventSource | null = null;

  private readonly url: string;
  private readonly EventSourceCtor: new (url: string) => EventSource;

  constructor(
    url: string = DEFAULT_URL,
    EventSourceCtor: new (url: string) => EventSource = EventSource
  ) {
    this.url = url;
    this.EventSourceCtor = EventSourceCtor;
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

  private connect(): void {
    if (this.source) return;
    this.source = new this.EventSourceCtor(this.url);
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
  }
}
