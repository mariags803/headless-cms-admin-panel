import express, { type Express } from 'express';
import { createSchemaRouter, type SchemaControllerDeps } from './SchemaController';
import { createEntryRouter, type EntryControllerDeps } from './EntryController';
import { createContentRouter, type ContentControllerDeps } from './ContentController';
import { createEventsRouter, type EventsControllerDeps } from './EventsController';
import { errorHandler } from './errorHandler';

export interface ServerDeps {
  schema: SchemaControllerDeps;
  entry: EntryControllerDeps;
  content: ContentControllerDeps;
  events: EventsControllerDeps;
}

export function createServer(deps: ServerDeps): Express {
  const app = express();
  app.use(express.json());
  app.use('/schemas', createSchemaRouter(deps.schema));
  app.use('/entries', createEntryRouter(deps.entry));
  app.use('/api/content', createContentRouter(deps.content));
  app.use('/events', createEventsRouter(deps.events));
  app.use(errorHandler);
  return app;
}
