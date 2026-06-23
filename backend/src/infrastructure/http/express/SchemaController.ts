import { Router } from 'express';
import type { CreateSchema } from '../../../application/schema/CreateSchema';
import type { ListSchemas } from '../../../application/schema/ListSchemas';
import type { UpdateSchema } from '../../../application/schema/UpdateSchema';
import type { DeleteSchema } from '../../../application/schema/DeleteSchema';

export interface SchemaControllerDeps {
  createSchema: CreateSchema;
  listSchemas: ListSchemas;
  updateSchema: UpdateSchema;
  deleteSchema: DeleteSchema;
}

export function createSchemaRouter(deps: SchemaControllerDeps): Router {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      res.json(await deps.listSchemas.execute());
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      res.status(201).json(await deps.createSchema.execute(req.body));
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      res.json(await deps.updateSchema.execute({ ...req.body, id: req.params.id }));
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      await deps.deleteSchema.execute(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
