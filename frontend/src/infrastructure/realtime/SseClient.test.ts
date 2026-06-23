import { SseClient } from './SseClient';

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  close = jest.fn();

  readonly url: string;

  constructor(url: string) {
    this.url = url;
    FakeEventSource.instances.push(this);
  }

  emit(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

describe('SseClient', () => {
  beforeEach(() => {
    FakeEventSource.instances = [];
  });

  it('opens the connection lazily on first subscribe', () => {
    const client = new SseClient('http://localhost:3001/events', FakeEventSource as never);
    expect(FakeEventSource.instances).toHaveLength(0);

    client.subscribe(() => {});

    expect(FakeEventSource.instances).toHaveLength(1);
    expect(FakeEventSource.instances[0].url).toBe('http://localhost:3001/events');
  });

  it('delivers parsed DomainEvents to a subscribed listener', () => {
    const client = new SseClient('http://localhost:3001/events', FakeEventSource as never);
    const listener = jest.fn();
    client.subscribe(listener);

    FakeEventSource.instances[0].emit({ type: 'schema.deleted', schemaId: 's1' });

    expect(listener).toHaveBeenCalledWith({ type: 'schema.deleted', schemaId: 's1' });
  });

  it('delivers events to every subscribed listener', () => {
    const client = new SseClient('http://localhost:3001/events', FakeEventSource as never);
    const a = jest.fn();
    const b = jest.fn();
    client.subscribe(a);
    client.subscribe(b);

    FakeEventSource.instances[0].emit({ type: 'schema.deleted', schemaId: 's1' });

    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('stops delivering to a listener after it unsubscribes', () => {
    const client = new SseClient('http://localhost:3001/events', FakeEventSource as never);
    const listener = jest.fn();
    const unsubscribe = client.subscribe(listener);

    unsubscribe();
    FakeEventSource.instances[0].emit({ type: 'schema.deleted', schemaId: 's1' });

    expect(listener).not.toHaveBeenCalled();
  });

  it('closes the connection once the last listener unsubscribes', () => {
    const client = new SseClient('http://localhost:3001/events', FakeEventSource as never);
    const a = jest.fn();
    const b = jest.fn();
    const unsubscribeA = client.subscribe(a);
    const unsubscribeB = client.subscribe(b);
    const es = FakeEventSource.instances[0];

    unsubscribeA();
    expect(es.close).not.toHaveBeenCalled();

    unsubscribeB();
    expect(es.close).toHaveBeenCalledTimes(1);
  });

  it('reopens the connection lazily after closing', () => {
    const client = new SseClient('http://localhost:3001/events', FakeEventSource as never);
    const unsubscribe = client.subscribe(() => {});
    unsubscribe();

    client.subscribe(() => {});

    expect(FakeEventSource.instances).toHaveLength(2);
  });
});
