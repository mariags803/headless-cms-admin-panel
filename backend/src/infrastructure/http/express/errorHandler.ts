import type { ErrorRequestHandler } from 'express';
import { InvalidSchema, SchemaNotFound } from '../../../domain/schema/SchemaErrors';
import { EntryNotFound, InvalidEntry } from '../../../domain/entry/EntryErrors';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof SchemaNotFound || err instanceof EntryNotFound) {
    res.status(404).json({ error: 'NOT_FOUND', message: err.message });
    return;
  }
  if (err instanceof InvalidSchema || err instanceof InvalidEntry) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: err.message, details: err.errors });
    return;
  }
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Unexpected error' });
};
