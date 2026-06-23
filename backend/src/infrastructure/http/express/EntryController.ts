import { Router } from 'express';
import type { CreateEntry } from '../../../application/entry/CreateEntry';
import type { ListEntries } from '../../../application/entry/ListEntries';
import type { GetEntry } from '../../../application/entry/GetEntry';
import type { UpdateEntry } from '../../../application/entry/UpdateEntry';
import type { DeleteEntry } from '../../../application/entry/DeleteEntry';

export interface EntryControllerDeps {
  createEntry: CreateEntry;
  listEntries: ListEntries;
  getEntry: GetEntry;
  updateEntry: UpdateEntry;
  deleteEntry: DeleteEntry;
}

export function createEntryRouter(deps: EntryControllerDeps): Router {
  const router = Router();

  router.get('/', async (req, res, next) => {
    const schemaId = req.query.schema;
    if (typeof schemaId !== 'string' || !schemaId.trim()) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'schema query parameter is required',
        details: [{ message: 'schema is required' }],
      });
      return;
    }
    try {
      res.json(await deps.listEntries.execute(schemaId));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      res.json(await deps.getEntry.execute(req.params.id));
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      res.status(201).json(await deps.createEntry.execute(req.body));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      res.json(await deps.updateEntry.execute({ ...req.body, id: req.params.id }));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await deps.deleteEntry.execute(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
