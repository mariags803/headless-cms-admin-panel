import { Router } from 'express';
import type { ListContent } from '../../../application/content/ListContent';
import type { GetContentEntry } from '../../../application/content/GetContentEntry';

export interface ContentControllerDeps {
  listContent: ListContent;
  getContentEntry: GetContentEntry;
}

export function createContentRouter(deps: ContentControllerDeps): Router {
  const router = Router();

  router.get('/:schema', async (req, res, next) => {
    try {
      res.json(await deps.listContent.execute(req.params.schema));
    } catch (err) {
      next(err);
    }
  });

  router.get('/:schema/:id', async (req, res, next) => {
    try {
      res.json(await deps.getContentEntry.execute(req.params.schema, req.params.id));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
