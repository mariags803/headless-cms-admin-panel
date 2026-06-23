import { Router } from 'express';
import type { SseEventPublisher } from '../../realtime/SseEventPublisher';

export interface EventsControllerDeps {
  publisher: SseEventPublisher;
}

export function createEventsRouter(deps: EventsControllerDeps): Router {
  const router = Router();

  router.get('/', (req, res) => {
    deps.publisher.subscribe(res);
  });

  return router;
}
