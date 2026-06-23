import type { DomainEvent } from '../../domain/events/DomainEvent';
import type { EventPublisher } from '../ports/EventPublisher';

export class InMemoryEventPublisher implements EventPublisher {
  readonly events: DomainEvent[] = [];

  publish(event: DomainEvent): void {
    this.events.push(event);
  }
}
