import type { DomainEvent } from '../../domain/events/DomainEvent';

export interface EventPublisher {
  publish(event: DomainEvent): void;
}
