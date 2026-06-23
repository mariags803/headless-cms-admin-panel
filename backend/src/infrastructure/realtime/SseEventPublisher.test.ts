import type { Response } from 'express';
import { SseEventPublisher } from './SseEventPublisher';

function fakeResponse() {
  const listeners: Record<string, () => void> = {};
  return {
    writeHead: jest.fn(),
    write: jest.fn(),
    on: jest.fn((event: string, cb: () => void) => {
      listeners[event] = cb;
    }),
    emitClose: () => listeners.close?.(),
  } as unknown as Response & { write: jest.Mock; writeHead: jest.Mock; emitClose: () => void };
}

describe('SseEventPublisher', () => {
  it('sets SSE headers and keeps the connection open on subscribe', () => {
    const publisher = new SseEventPublisher();
    const res = fakeResponse();

    publisher.subscribe(res);

    expect(res.writeHead).toHaveBeenCalledWith(
      200,
      expect.objectContaining({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })
    );
  });

  it('writes a published event to every subscribed connection', () => {
    const publisher = new SseEventPublisher();
    const res1 = fakeResponse();
    const res2 = fakeResponse();
    publisher.subscribe(res1);
    publisher.subscribe(res2);

    publisher.publish({ type: 'schema.deleted', schemaId: 's1' });

    const expected = `data: ${JSON.stringify({ type: 'schema.deleted', schemaId: 's1' })}\n\n`;
    expect(res1.write).toHaveBeenCalledWith(expected);
    expect(res2.write).toHaveBeenCalledWith(expected);
  });

  it('stops writing to a connection once it closes', () => {
    const publisher = new SseEventPublisher();
    const res = fakeResponse();
    publisher.subscribe(res);

    res.emitClose();
    publisher.publish({ type: 'schema.deleted', schemaId: 's1' });

    expect(res.write).not.toHaveBeenCalled();
  });
});
