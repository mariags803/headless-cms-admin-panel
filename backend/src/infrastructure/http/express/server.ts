import express, { type Express } from 'express';
import { createSchemaRouter, type SchemaControllerDeps } from './SchemaController';
import { errorHandler } from './errorHandler';

export interface ServerDeps {
  schema: SchemaControllerDeps;
}

export function createServer(deps: ServerDeps): Express {
  const app = express();
  app.use(express.json());
  app.use('/schemas', createSchemaRouter(deps.schema));
  app.use(errorHandler);
  return app;
}
