import type { Response } from 'express';
import type { EventPublisher } from '../../application/ports/EventPublisher';
import type { DomainEvent } from '../../domain/events/DomainEvent';

export class SseEventPublisher implements EventPublisher {
  private readonly clients = new Set<Response>();

  subscribe(res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    this.clients.add(res);
    res.on('close', () => this.clients.delete(res));
  }

  publish(event: DomainEvent): void {
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      client.write(payload);
    }
  }
}
